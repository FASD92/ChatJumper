export interface UserMessageTargetSelection {
  target: HTMLElement;
  targetCount: number;
}

export interface QuestionNavigatorOptions {
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
    return createSelection(viewportTarget, targets.length);
  }

  const previousIndex = targets.indexOf(previousSelection.target);
  const viewportIndex = targets.indexOf(viewportTarget);

  if (
    previousIndex === -1 ||
    viewportIndex === -1 ||
    viewportIndex > previousIndex
  ) {
    return createSelection(viewportTarget, targets.length);
  }

  const target =
    previousIndex > 0 ? targets[previousIndex - 1] : targets[targets.length - 1];
  return createSelection(target, targets.length);
}

function getVerticalCenter(target: HTMLElement): number {
  const rect = target.getBoundingClientRect();

  return rect.top + rect.height / 2;
}

function createSelection(
  target: HTMLElement,
  targetCount: number
): UserMessageTargetSelection {
  return {
    target,
    targetCount
  };
}
