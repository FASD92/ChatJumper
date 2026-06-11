// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  createQuestionNavigator,
  selectNextUserMessageTarget
} from "../../src/content/questionNavigator";

describe("selectNextUserMessageTarget", () => {
  it("selects the latest user question that has passed above the top reference line", () => {
    const oldest = createMessageWithBounds(-1600, -1500);
    const previous = createMessageWithBounds(-400, -300);
    const latest = createMessageWithBounds(-120, -40);

    const selection = selectNextUserMessageTarget([oldest, previous, latest], {
      viewportHeight: 1000
    });

    expect(selection?.target).toBe(latest);
  });

  it("selects the previous question when the latest question has not passed the top reference line", () => {
    const older = createMessageWithBounds(-1200, -1100);
    const previous = createMessageWithBounds(20, 80);
    const latest = createMessageWithBounds(100, 300);

    const selection = selectNextUserMessageTarget([older, previous, latest], {
      viewportHeight: 1000
    });

    expect(selection?.target).toBe(previous);
  });

  it("falls back to the latest question when no question has passed the top reference line", () => {
    const previous = createMessageWithBounds(180, 260);
    const latest = createMessageWithBounds(600, 700);

    const selection = selectNextUserMessageTarget([previous, latest], {
      viewportHeight: 1000
    });

    expect(selection?.target).toBe(latest);
  });

  it("uses the current viewport on every repeated button press", () => {
    const third = createMessageWithBounds(-1200, -1100);
    const second = createMessageWithBounds(-200, 80);
    const latest = createMessageWithBounds(-120, -40);
    const navigator = createQuestionNavigator({
      getViewportHeight: () => 1000
    });

    document.body.append(third, second, latest);

    expect(navigator.next([third, second, latest])?.target).toBe(latest);

    setMessageBounds(latest, 360, 680);
    setMessageBounds(second, -160, 80);

    expect(navigator.next([third, second, latest])?.target).toBe(second);

    setMessageBounds(second, 360, 680);
    setMessageBounds(third, -160, 80);

    expect(navigator.next([third, second, latest])?.target).toBe(third);
  });

  it("starts a fresh click sequence at the latest question after page load", () => {
    const oldest = createMessageWithBounds(-95, 1);
    const second = createMessageWithBounds(79, 211);
    const latest = createMessageWithBounds(709, 841);
    const navigator = createQuestionNavigator({
      getViewportHeight: () => 1000
    });

    expect(navigator.next([oldest, second, latest])?.target).toBe(latest);
  });

  it("uses the current viewport after manual navigation resets the fresh sequence", () => {
    const oldest = createMessageWithBounds(-95, 1);
    const second = createMessageWithBounds(79, 211);
    const latest = createMessageWithBounds(709, 841);
    const navigator = createQuestionNavigator({
      getViewportHeight: () => 1000
    });

    navigator.reset();

    expect(navigator.next([oldest, second, latest])?.target).toBe(oldest);
  });

  it("continues the cached click sequence when the current DOM list skips intermediate questions", () => {
    const sixth = createMessageWithBounds(-2400, -2300);
    const fifth = createMessageWithBounds(-1900, -1800);
    const fourth = createMessageWithBounds(-1400, -1300);
    const third = createMessageWithBounds(-900, -800);
    const second = createMessageWithBounds(-200, 80);
    const latest = createMessageWithBounds(-120, -40);
    const navigator = createQuestionNavigator({
      getViewportHeight: () => 1000
    });
    const fullTargets = [sixth, fifth, fourth, third, second, latest];

    document.body.append(...fullTargets);

    expect(navigator.next(fullTargets)?.target).toBe(latest);

    setMessageBounds(latest, 360, 680);
    setMessageBounds(second, -160, 80);

    expect(navigator.next([sixth, second, latest])?.target).toBe(second);

    setMessageBounds(second, 360, 680);
    setMessageBounds(sixth, -160, 80);

    expect(navigator.next([sixth, second, latest])?.target).toBe(third);
  });

  it("continues the cached click sequence when ChatGPT remounts message nodes with stable ids", () => {
    const navigator = createQuestionNavigator({
      getViewportHeight: () => 1000
    });
    const initialTargets = createOrderedMessages([
      [-2400, -2300],
      [-1900, -1800],
      [-1400, -1300],
      [-900, -800],
      [-200, 80],
      [-120, -40]
    ]);

    document.body.replaceChildren(...initialTargets);

    expect(navigator.next(initialTargets)?.target).toBe(initialTargets[5]);

    const afterLatestJumpTargets = createOrderedMessages([
      [-2400, -2300],
      [-1900, -1800],
      [-1400, -1300],
      [-900, -800],
      [-160, 80],
      [360, 680]
    ]);

    document.body.replaceChildren(...afterLatestJumpTargets);

    expect(navigator.next(afterLatestJumpTargets)?.target).toBe(
      afterLatestJumpTargets[4]
    );

    const afterSecondJumpTargets = createOrderedMessages([
      [-160, 80],
      [300, 420],
      [440, 560],
      [580, 700],
      [720, 840],
      [860, 980]
    ]);

    document.body.replaceChildren(...afterSecondJumpTargets);

    expect(navigator.next(afterSecondJumpTargets)?.target).toBe(
      afterSecondJumpTargets[3]
    );
  });

  it("continues the cached click sequence when ChatGPT turn sections expose only turn ids", () => {
    const navigator = createQuestionNavigator({
      getViewportHeight: () => 1000
    });
    const initialTargets = createOrderedTurnSections([
      [-2400, -2300],
      [-1900, -1800],
      [-1400, -1300],
      [-900, -800],
      [-200, 80],
      [-120, -40]
    ]);

    document.body.replaceChildren(...initialTargets);

    expect(navigator.next(initialTargets)?.target).toBe(initialTargets[5]);

    const afterLatestJumpTargets = createOrderedTurnSections([
      [-2400, -2300],
      [-1900, -1800],
      [-1400, -1300],
      [-900, -800],
      [-160, 80],
      [360, 680]
    ]);

    document.body.replaceChildren(...afterLatestJumpTargets);

    expect(navigator.next(afterLatestJumpTargets)?.target).toBe(
      afterLatestJumpTargets[4]
    );

    const afterSecondJumpTargets = createOrderedTurnSections([
      [-2400, -2300],
      [-1900, -1800],
      [-160, 80],
      [360, 680],
      [720, 840],
      [860, 980]
    ]);

    document.body.replaceChildren(...afterSecondJumpTargets);

    expect(navigator.next(afterSecondJumpTargets)?.target).toBe(
      afterSecondJumpTargets[3]
    );
  });

  it("uses the current viewport after manual navigation resets the click sequence", () => {
    const previous = createMessageWithBounds(-160, 80);
    const latest = createMessageWithBounds(-120, -40);
    const navigator = createQuestionNavigator({
      getViewportHeight: () => 1000
    });

    expect(navigator.next([previous, latest])?.target).toBe(latest);

    setMessageBounds(latest, 100, 300);
    setMessageBounds(previous, -160, 80);
    navigator.reset();

    expect(navigator.next([previous, latest])?.target).toBe(previous);
  });

  it("starts at the latest question for a fresh sequence even when another question has passed the reference line", () => {
    const previous = createMessageWithBounds(-160, 80);
    const latest = createMessageWithBounds(100, 300);
    const navigator = createQuestionNavigator({
      getViewportHeight: () => 1000
    });

    expect(navigator.next([previous, latest])?.target).toBe(latest);
  });

  it("uses a smaller reference line on short viewports", () => {
    const previous = createMessageWithBounds(40, 80);
    const latest = createMessageWithBounds(90, 160);

    const selection = selectNextUserMessageTarget([previous, latest], {
      viewportHeight: 180
    });

    expect(selection?.target).toBe(previous);
  });
});

function createMessageWithBounds(top: number, bottom: number): HTMLElement {
  const element = document.createElement("article");
  setMessageBounds(element, top, bottom);
  return element;
}

function createOrderedMessages(
  bounds: readonly (readonly [number, number])[]
): HTMLElement[] {
  const latestFirstIds = [
    "question-6",
    "question-5",
    "question-4",
    "question-3",
    "question-2",
    "question-1"
  ];

  return bounds.map(([top, bottom], index) => {
    const element = createMessageWithBounds(top, bottom);
    element.dataset.messageId = latestFirstIds[index];
    return element;
  });
}

function createOrderedTurnSections(
  bounds: readonly (readonly [number, number])[]
): HTMLElement[] {
  return createOrderedMessages(bounds).map((message) => {
    const section = document.createElement("section");
    section.dataset.turn = "user";
    section.dataset.turnId = message.dataset.messageId;
    setMessageBounds(
      section,
      message.getBoundingClientRect().top,
      message.getBoundingClientRect().bottom
    );
    return section;
  });
}

function setMessageBounds(
  element: HTMLElement,
  top: number,
  bottom: number
): void {
  const height = bottom - top;

  element.getBoundingClientRect = () =>
    ({
      top,
      bottom,
      height
    }) as DOMRect;
}
