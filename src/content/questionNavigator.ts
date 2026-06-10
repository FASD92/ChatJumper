export interface UserMessageTargetSelection {
  target: HTMLElement;
  targetCount: number;
}

export interface QuestionNavigator {
  next(targets: readonly HTMLElement[]): UserMessageTargetSelection | null;
  reset(): void;
}

export function createQuestionNavigator(): QuestionNavigator {
  let previousSelection: UserMessageTargetSelection | null = null;

  return {
    next(targets: readonly HTMLElement[]): UserMessageTargetSelection | null {
      previousSelection = selectNextUserMessageTarget(
        targets,
        previousSelection
      );
      return previousSelection;
    },

    reset(): void {
      previousSelection = null;
    }
  };
}

export function selectNextUserMessageTarget(
  targets: readonly HTMLElement[],
  previousSelection: UserMessageTargetSelection | null
): UserMessageTargetSelection | null {
  if (targets.length === 0) {
    return null;
  }

  if (!previousSelection || previousSelection.targetCount !== targets.length) {
    return createSelection(targets[targets.length - 1], targets.length);
  }

  const previousIndex = targets.indexOf(previousSelection.target);

  if (previousIndex <= 0) {
    return createSelection(targets[targets.length - 1], targets.length);
  }

  return createSelection(targets[previousIndex - 1], targets.length);
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
