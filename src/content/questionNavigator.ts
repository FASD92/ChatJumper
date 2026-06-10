export interface UserMessageTargetSelection {
  target: HTMLElement;
  targetCount: number;
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
const CURRENT_TARGET_EXCLUSION_PX = 24;

export function createQuestionNavigator(
  options: QuestionNavigatorOptions = {}
): QuestionNavigator {
  return {
    next(targets: readonly HTMLElement[]): UserMessageTargetSelection | null {
      return selectNextUserMessageTarget(targets, {
        viewportHeight: options.getViewportHeight?.() ?? window.innerHeight
      });
    },

    reset(): void {
      return;
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
  const target =
    candidatesAboveThreshold.at(-1) ?? targets[targets.length - 1];

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
