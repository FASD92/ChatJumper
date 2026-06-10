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
}

const DEFAULT_VIEWPORT_THRESHOLD_RATIO = 0.5;
const PASSED_QUESTION_REFERENCE_Y_PX = 120;

export function createQuestionNavigator(
  options: QuestionNavigatorOptions = {}
): QuestionNavigator {
  return {
    next(targets: readonly HTMLElement[]): UserMessageTargetSelection | null {
      return selectNextUserMessageTarget(targets, {
        viewportHeight: options.getViewportHeight?.() ?? window.innerHeight
      });
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
