export interface UserMessageTargetSelection {
  target: HTMLElement;
}

export interface QuestionNavigatorOptions {
  getViewportHeight?: () => number;
}

export interface SelectNextUserMessageTargetOptions {
  viewportHeight?: number;
}

export interface QuestionNavigator {
  next(targets: readonly HTMLElement[]): UserMessageTargetSelection | null;
  reset(): void;
}

const DEFAULT_VIEWPORT_THRESHOLD_RATIO = 0.5;
const PASSED_QUESTION_REFERENCE_Y_PX = 120;

export function createQuestionNavigator(
  options: QuestionNavigatorOptions = {}
): QuestionNavigator {
  let cachedTargets: readonly HTMLElement[] = [];
  let previousSelection: UserMessageTargetSelection | null = null;

  return {
    next(targets: readonly HTMLElement[]): UserMessageTargetSelection | null {
      cachedTargets = mergeTargetCache(cachedTargets, targets);

      if (previousSelection) {
        const sequencedTarget = selectPreviousCachedTarget(
          cachedTargets,
          previousSelection.target
        );

        if (sequencedTarget) {
          previousSelection = createSelection(sequencedTarget);
          return previousSelection;
        }
      }

      previousSelection = selectNextUserMessageTarget(targets, {
        viewportHeight: options.getViewportHeight?.() ?? window.innerHeight
      });

      return previousSelection;
    },

    reset(): void {
      previousSelection = null;
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

  return createSelection(viewportTarget);
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

function createSelection(target: HTMLElement): UserMessageTargetSelection {
  return {
    target
  };
}

function mergeTargetCache(
  cachedTargets: readonly HTMLElement[],
  currentTargets: readonly HTMLElement[]
): readonly HTMLElement[] {
  if (currentTargets.length === 0) {
    return cachedTargets;
  }

  if (cachedTargets.length === 0 || currentTargets.length >= cachedTargets.length) {
    return currentTargets;
  }

  const hasOverlap = currentTargets.some((target) =>
    cachedTargets.includes(target)
  );

  return hasOverlap ? cachedTargets : currentTargets;
}

function selectPreviousCachedTarget(
  cachedTargets: readonly HTMLElement[],
  previousTarget: HTMLElement
): HTMLElement | null {
  const previousIndex = cachedTargets.indexOf(previousTarget);

  if (previousIndex <= 0) {
    return null;
  }

  const target = cachedTargets[previousIndex - 1];

  return target.isConnected ? target : null;
}
