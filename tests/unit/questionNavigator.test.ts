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

    expect(navigator.next([third, second, latest])?.target).toBe(latest);

    setMessageBounds(latest, 360, 680);
    setMessageBounds(second, -160, 80);

    expect(navigator.next([third, second, latest])?.target).toBe(second);

    setMessageBounds(second, 360, 680);
    setMessageBounds(third, -160, 80);

    expect(navigator.next([third, second, latest])?.target).toBe(third);
  });

  it("uses the current viewport after a small wheel movement between the latest and previous question", () => {
    const previous = createMessageWithBounds(-160, 80);
    const latest = createMessageWithBounds(100, 300);
    const navigator = createQuestionNavigator({
      getViewportHeight: () => 1000
    });

    expect(navigator.next([previous, latest])?.target).toBe(previous);
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
