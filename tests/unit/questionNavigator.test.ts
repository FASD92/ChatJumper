// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  createQuestionNavigator,
  selectNextUserMessageTarget
} from "../../src/content/questionNavigator";

describe("selectNextUserMessageTarget", () => {
  it("selects the latest message above the current viewport threshold", () => {
    const first = createMessageAtCenter(-1600);
    const second = createMessageAtCenter(-900);
    const latest = createMessageAtCenter(-80);
    const targets = [first, second, latest];

    const selection = selectNextUserMessageTarget(targets, {
      viewportHeight: 1000
    });

    expect(selection?.target).toBe(latest);
  });

  it("selects the previous message after the latest message is centered", () => {
    const first = createMessageAtCenter(-1200);
    const previous = createMessageAtCenter(420);
    const latest = createMessageAtCenter(520);

    const selection = selectNextUserMessageTarget([first, previous, latest], {
      viewportHeight: 1000
    });

    expect(selection?.target).toBe(previous);
  });

  it("does not skip the nearest previous message just below the old top threshold", () => {
    const first = createMessageAtCenter(-1200);
    const nearestPrevious = createMessageAtCenter(430);
    const latest = createMessageAtCenter(520);

    const selection = selectNextUserMessageTarget(
      [first, nearestPrevious, latest],
      {
        viewportHeight: 1000
      }
    );

    expect(selection?.target).toBe(nearestPrevious);
  });

  it("falls back to the latest message when no message is above the threshold", () => {
    const first = createMessageAtCenter(600);
    const latest = createMessageAtCenter(900);

    const selection = selectNextUserMessageTarget([first, latest], {
      viewportHeight: 1000
    });

    expect(selection?.target).toBe(latest);
  });

  it("uses the current viewport on every navigator call", () => {
    const first = createMessageAtCenter(-1200);
    const previous = createMessageAtCenter(420);
    const latest = createMessageAtCenter(520);
    const navigator = createQuestionNavigator({
      getViewportHeight: () => 1000
    });

    expect(navigator.next([first, previous, latest])?.target).toBe(previous);

    setMessageCenter(latest, -80);

    expect(navigator.next([first, previous, latest])?.target).toBe(latest);
  });

  it("walks to the exact previous question without skipping multiple older questions", () => {
    const sixth = createMessageAtCenter(-2600);
    const fifth = createMessageAtCenter(-2100);
    const fourth = createMessageAtCenter(-1600);
    const third = createMessageAtCenter(-1100);
    const second = createMessageAtCenter(420);
    const latest = createMessageAtCenter(-80);
    const navigator = createQuestionNavigator({
      getViewportHeight: () => 1000
    });
    const targets = [sixth, fifth, fourth, third, second, latest];

    expect(navigator.next(targets)?.target).toBe(latest);

    setMessageCenter(latest, 520);
    setMessageCenter(second, 420);

    expect(navigator.next(targets)?.target).toBe(second);

    setMessageCenter(second, 520);
    setMessageCenter(third, 420);

    expect(navigator.next(targets)?.target).toBe(third);
  });

  it("uses remembered sequence to avoid skipping when the next previous question is below the viewport threshold", () => {
    const sixth = createMessageAtCenter(-2600);
    const fifth = createMessageAtCenter(-2100);
    const fourth = createMessageAtCenter(-1600);
    const third = createMessageAtCenter(520);
    const second = createMessageAtCenter(420);
    const latest = createMessageAtCenter(-80);
    const navigator = createQuestionNavigator({
      getViewportHeight: () => 1000
    });
    const targets = [sixth, fifth, fourth, third, second, latest];

    expect(navigator.next(targets)?.target).toBe(latest);

    setMessageCenter(latest, 520);

    expect(navigator.next(targets)?.target).toBe(second);

    setMessageCenter(second, 520);

    expect(navigator.next(targets)?.target).toBe(third);
  });

  it("keeps walking by cached index when ChatGPT remounts message elements", () => {
    const navigator = createQuestionNavigator({
      getViewportHeight: () => 1000
    });
    const initialTargets = [
      createMessageAtCenter(-2600),
      createMessageAtCenter(-2100),
      createMessageAtCenter(-1600),
      createMessageAtCenter(520),
      createMessageAtCenter(420),
      createMessageAtCenter(-80)
    ];

    expect(navigator.next(initialTargets)?.target).toBe(initialTargets[5]);

    const remountedTargets = [
      createMessageAtCenter(-2600),
      createMessageAtCenter(-2100),
      createMessageAtCenter(-1600),
      createMessageAtCenter(420),
      createMessageAtCenter(520),
      createMessageAtCenter(520)
    ];

    expect(navigator.next(remountedTargets)?.target).toBe(remountedTargets[4]);

    const remountedAgainTargets = [
      createMessageAtCenter(-2600),
      createMessageAtCenter(-2100),
      createMessageAtCenter(420),
      createMessageAtCenter(420),
      createMessageAtCenter(520),
      createMessageAtCenter(620)
    ];

    expect(navigator.next(remountedAgainTargets)?.target).toBe(
      remountedAgainTargets[3]
    );
  });

  it("resets to latest when the user is back near the bottom of the conversation", () => {
    let isNearBottom = false;
    const third = createMessageAtCenter(-1200);
    const second = createMessageAtCenter(420);
    const latest = createMessageAtCenter(-80);
    const navigator = createQuestionNavigator({
      getIsNearConversationBottom: () => isNearBottom,
      getViewportHeight: () => 1000
    });

    expect(navigator.next([third, second, latest])?.target).toBe(latest);

    setMessageCenter(latest, 520);

    expect(navigator.next([third, second, latest])?.target).toBe(second);

    isNearBottom = true;

    expect(navigator.next([third, second, latest])?.target).toBe(latest);
  });

  it("resets to latest when the user scrolls back down near the latest question", () => {
    const second = createMessageAtCenter(420);
    const latest = createMessageAtCenter(-80);
    const navigator = createQuestionNavigator({
      getViewportHeight: () => 1000
    });
    const targets = [second, latest];

    expect(navigator.next(targets)?.target).toBe(latest);

    setMessageCenter(latest, 520);

    expect(navigator.next(targets)?.target).toBe(second);

    setMessageCenter(latest, -80);

    expect(navigator.next(targets)?.target).toBe(latest);
  });
});

function createMessageAtCenter(centerY: number): HTMLElement {
  const element = document.createElement("article");
  setMessageCenter(element, centerY);
  return element;
}

function setMessageCenter(element: HTMLElement, centerY: number): void {
  const height = 100;
  const top = centerY - height / 2;
  const bottom = centerY + height / 2;

  element.getBoundingClientRect = () =>
    ({
      top,
      bottom,
      height
    }) as DOMRect;
}
