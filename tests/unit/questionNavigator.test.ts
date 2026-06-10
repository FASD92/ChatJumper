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
