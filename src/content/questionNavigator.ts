export interface UserMessageTargetSelection {
  target: HTMLElement;
  targetCount: number;
  targetIndex: number;
}

export interface QuestionNavigatorOptions {
  getIsNearConversationBottom?: () => boolean;
  getViewportHeight?: () => number;
}

export interface SelectNextUserMessageTargetOptions {
  previousSelection?: UserMessageTargetSelection | null;
  viewportHeight?: number;
}

export interface QuestionNavigator {
  next(targets: readonly HTMLElement[]): UserMessageTargetSelection | null;
  reset(): void;
}

const DEFAULT_VIEWPORT_THRESHOLD_RATIO = 0.5;
const CURRENT_TARGET_EXCLUSION_PX = 24;

export function createQuestionNavigator(
  options: QuestionNavigatorOptions = {}
): QuestionNavigator {
  let previousSelection: UserMessageTargetSelection | null = null;

  return {
    next(targets: readonly HTMLElement[]): UserMessageTargetSelection | null {
      if (!previousSelection && options.getIsNearConversationBottom?.()) {
        previousSelection = selectLatestUserMessageTarget(targets);
        return previousSelection;
      }

      previousSelection = selectNextUserMessageTarget(targets, {
        previousSelection,
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

  const viewportHeight = options.viewportHeight ?? window.innerHeight;
  const thresholdCenter =
    viewportHeight * DEFAULT_VIEWPORT_THRESHOLD_RATIO -
    CURRENT_TARGET_EXCLUSION_PX;
  const candidatesAboveThreshold = targets.filter(
    (target) => getVerticalCenter(target) < thresholdCenter
  );
  const viewportTarget =
    candidatesAboveThreshold.at(-1) ?? targets[targets.length - 1];
  const previousSelection = options.previousSelection ?? null;

  if (!previousSelection || previousSelection.targetCount !== targets.length) {
    return createSelection(viewportTarget, targets);
  }

  const cachedPreviousIndex = previousSelection.targetIndex;

  if (
    cachedPreviousIndex < 0 ||
    cachedPreviousIndex >= targets.length
  ) {
    return createSelection(viewportTarget, targets);
  }

  const target =
    cachedPreviousIndex > 0
      ? targets[cachedPreviousIndex - 1]
      : targets[targets.length - 1];
  return createSelection(target, targets);
}

function selectLatestUserMessageTarget(
  targets: readonly HTMLElement[]
): UserMessageTargetSelection | null {
  if (targets.length === 0) {
    return null;
  }

  return createSelection(targets[targets.length - 1], targets);
}

function getVerticalCenter(target: HTMLElement): number {
  const rect = target.getBoundingClientRect();

  return rect.top + rect.height / 2;
}

function createSelection(
  target: HTMLElement,
  targets: readonly HTMLElement[]
): UserMessageTargetSelection {
  return {
    target,
    targetCount: targets.length,
    targetIndex: targets.indexOf(target)
  };
}
