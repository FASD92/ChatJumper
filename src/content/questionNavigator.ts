export interface UserMessageTargetSelection {
  target: HTMLElement;
  targetKey: string | null;
}

export interface QuestionNavigatorOptions {
  getViewportHeight?: () => number;
  getTargetKey?: (target: HTMLElement) => string | null;
}

export interface SelectNextUserMessageTargetOptions {
  viewportHeight?: number;
  getTargetKey?: (target: HTMLElement) => string | null;
}

export interface QuestionNavigator {
  next(targets: readonly HTMLElement[]): UserMessageTargetSelection | null;
  reset(): void;
}

const DEFAULT_VIEWPORT_THRESHOLD_RATIO = 0.5;
const PASSED_QUESTION_REFERENCE_Y_PX = 120;
const STABLE_TARGET_KEY_SELECTOR = [
  "[data-message-id]",
  "[data-turn-id]",
  "[data-turn-id-container]",
  '[data-testid^="conversation-turn-"]'
].join(",");

interface CachedTarget {
  target: HTMLElement;
  targetKey: string | null;
}

export function createQuestionNavigator(
  options: QuestionNavigatorOptions = {}
): QuestionNavigator {
  const getTargetKey = options.getTargetKey ?? getStableTargetKey;
  let cachedTargets: readonly CachedTarget[] = [];
  let previousSelection: UserMessageTargetSelection | null = null;
  let useViewportForNextInitialSelection = false;

  return {
    next(targets: readonly HTMLElement[]): UserMessageTargetSelection | null {
      cachedTargets = mergeTargetCache(cachedTargets, targets, getTargetKey);

      if (previousSelection) {
        const sequencedSelection = selectPreviousCachedTarget(
          cachedTargets,
          previousSelection
        );

        if (sequencedSelection) {
          previousSelection = sequencedSelection;
          return previousSelection;
        }
      }

      previousSelection = useViewportForNextInitialSelection
        ? selectNextUserMessageTarget(targets, {
            viewportHeight: options.getViewportHeight?.() ?? window.innerHeight,
            getTargetKey
          })
        : selectLatestUserMessageTarget(targets, getTargetKey);
      useViewportForNextInitialSelection = false;

      return previousSelection;
    },

    reset(): void {
      previousSelection = null;
      useViewportForNextInitialSelection = true;
    }
  };
}

export function selectNextUserMessageTarget(
  targets: readonly HTMLElement[],
  options: SelectNextUserMessageTargetOptions = {}
): UserMessageTargetSelection | null {
  if (targets.length === 0) {
    return null;
  }

  const referenceY = getReferenceY(options.viewportHeight ?? window.innerHeight);
  const passedTargets = targets.filter(
    (target) => getVerticalBottom(target) < referenceY
  );
  const viewportTarget =
    passedTargets.at(-1) ?? targets[targets.length - 1];

  return createSelection(
    viewportTarget,
    (options.getTargetKey ?? getStableTargetKey)(viewportTarget)
  );
}

function selectLatestUserMessageTarget(
  targets: readonly HTMLElement[],
  getTargetKey: (target: HTMLElement) => string | null
): UserMessageTargetSelection | null {
  if (targets.length === 0) {
    return null;
  }

  const latestTarget = targets[targets.length - 1];

  return createSelection(latestTarget, getTargetKey(latestTarget));
}

function getVerticalBottom(target: HTMLElement): number {
  const rect = target.getBoundingClientRect();

  return rect.bottom;
}

function getReferenceY(viewportHeight: number): number {
  return Math.min(
    PASSED_QUESTION_REFERENCE_Y_PX,
    viewportHeight * DEFAULT_VIEWPORT_THRESHOLD_RATIO
  );
}

function createSelection(
  target: HTMLElement,
  targetKey: string | null
): UserMessageTargetSelection {
  return {
    target,
    targetKey
  };
}

function mergeTargetCache(
  cachedTargets: readonly CachedTarget[],
  currentTargets: readonly HTMLElement[],
  getTargetKey: (target: HTMLElement) => string | null
): readonly CachedTarget[] {
  if (currentTargets.length === 0) {
    return cachedTargets;
  }

  const currentEntries = currentTargets.map((target) =>
    createCachedTarget(target, getTargetKey)
  );

  if (cachedTargets.length === 0) {
    return currentEntries;
  }

  const currentByKey = createCurrentTargetKeyMap(currentEntries);
  const hasStableKeyOverlap = cachedTargets.some(
    (entry) => entry.targetKey !== null && currentByKey.has(entry.targetKey)
  );
  const hasIdentityOverlap = currentEntries.some((currentEntry) =>
    cachedTargets.some((cachedEntry) => cachedEntry.target === currentEntry.target)
  );

  if (!hasStableKeyOverlap && !hasIdentityOverlap) {
    return currentEntries;
  }

  if (currentEntries.length >= cachedTargets.length && hasStableKeyOverlap) {
    return currentEntries;
  }

  return cachedTargets.map((cachedEntry) => {
    if (cachedEntry.targetKey === null) {
      return cachedEntry;
    }

    return currentByKey.get(cachedEntry.targetKey) ?? cachedEntry;
  });
}

function selectPreviousCachedTarget(
  cachedTargets: readonly CachedTarget[],
  previousSelection: UserMessageTargetSelection
): UserMessageTargetSelection | null {
  const previousIndex = findPreviousSelectionIndex(
    cachedTargets,
    previousSelection
  );

  if (previousIndex <= 0) {
    return null;
  }

  for (let index = previousIndex - 1; index >= 0; index -= 1) {
    const cachedTarget = cachedTargets[index];

    if (cachedTarget.target.isConnected) {
      return createSelection(cachedTarget.target, cachedTarget.targetKey);
    }
  }

  return null;
}

function createCachedTarget(
  target: HTMLElement,
  getTargetKey: (target: HTMLElement) => string | null
): CachedTarget {
  return {
    target,
    targetKey: getTargetKey(target)
  };
}

function createCurrentTargetKeyMap(
  targets: readonly CachedTarget[]
): Map<string, CachedTarget> {
  const result = new Map<string, CachedTarget>();

  for (const target of targets) {
    if (target.targetKey !== null) {
      result.set(target.targetKey, target);
    }
  }

  return result;
}

function findPreviousSelectionIndex(
  cachedTargets: readonly CachedTarget[],
  previousSelection: UserMessageTargetSelection
): number {
  if (previousSelection.targetKey !== null) {
    const keyIndex = cachedTargets.findIndex(
      (cachedTarget) => cachedTarget.targetKey === previousSelection.targetKey
    );

    if (keyIndex !== -1) {
      return keyIndex;
    }
  }

  return cachedTargets.findIndex(
    (cachedTarget) => cachedTarget.target === previousSelection.target
  );
}

function getStableTargetKey(target: HTMLElement): string | null {
  const ownTargetKey = readStableTargetKey(target);

  if (ownTargetKey) {
    return ownTargetKey;
  }

  const ancestorWithStableKey = target.closest<HTMLElement>(
    STABLE_TARGET_KEY_SELECTOR
  );

  return ancestorWithStableKey ? readStableTargetKey(ancestorWithStableKey) : null;
}

function readStableTargetKey(target: HTMLElement): string | null {
  const conversationTurnTestId = target.getAttribute("data-testid");

  return (
    target.dataset.messageId ??
    target.dataset.turnId ??
    target.dataset.turnIdContainer ??
    (conversationTurnTestId?.startsWith("conversation-turn-")
      ? conversationTurnTestId
      : null)
  );
}
