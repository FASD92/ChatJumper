// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  createQuestionNavigator,
  selectNextUserMessageTarget
} from "../../src/content/questionNavigator";

describe("selectNextUserMessageTarget", () => {
  it("selects the latest message above the current viewport threshold", () => {
    const first = createMessageAtTop(-1600);
    const second = createMessageAtTop(-900);
    const latest = createMessageAtTop(-80);
    const targets = [first, second, latest];

    const selection = selectNextUserMessageTarget(targets, {
      viewportHeight: 1000
    });

    expect(selection?.target).toBe(latest);
  });

  it("selects the previous message after the latest message is centered", () => {
    const first = createMessageAtTop(-1200);
    const previous = createMessageAtTop(-200);
    const latest = createMessageAtTop(500);

    const selection = selectNextUserMessageTarget([first, previous, latest], {
      viewportHeight: 1000
    });

    expect(selection?.target).toBe(previous);
  });

  it("falls back to the latest message when no message is above the threshold", () => {
    const first = createMessageAtTop(600);
    const latest = createMessageAtTop(900);

    const selection = selectNextUserMessageTarget([first, latest], {
      viewportHeight: 1000
    });

    expect(selection?.target).toBe(latest);
  });

  it("uses the current viewport on every navigator call", () => {
    const first = createMessageAtTop(-1200);
    const previous = createMessageAtTop(-200);
    const latest = createMessageAtTop(500);
    const navigator = createQuestionNavigator({
      getViewportHeight: () => 1000
    });

    expect(navigator.next([first, previous, latest])?.target).toBe(previous);

    setMessageTop(latest, -80);

    expect(navigator.next([first, previous, latest])?.target).toBe(latest);
  });
});

function createMessageAtTop(top: number): HTMLElement {
  const element = document.createElement("article");
  setMessageTop(element, top);
  return element;
}

function setMessageTop(element: HTMLElement, top: number): void {
  element.getBoundingClientRect = () =>
    ({
      top
    }) as DOMRect;
}
