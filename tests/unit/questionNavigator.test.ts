// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  createQuestionNavigator,
  selectNextUserMessageTarget
} from "../../src/content/questionNavigator";

describe("selectNextUserMessageTarget", () => {
  it("starts at the latest message and then moves backward", () => {
    const first = document.createElement("article");
    const second = document.createElement("article");
    const latest = document.createElement("article");
    const targets = [first, second, latest];

    const firstSelection = selectNextUserMessageTarget(targets, null);
    const secondSelection = selectNextUserMessageTarget(targets, firstSelection);
    const thirdSelection = selectNextUserMessageTarget(targets, secondSelection);

    expect(firstSelection?.target).toBe(latest);
    expect(secondSelection?.target).toBe(second);
    expect(thirdSelection?.target).toBe(first);
  });

  it("resets to latest when the message list changes", () => {
    const first = document.createElement("article");
    const latest = document.createElement("article");
    const newer = document.createElement("article");
    const firstSelection = selectNextUserMessageTarget([first, latest], null);

    const nextSelection = selectNextUserMessageTarget(
      [first, latest, newer],
      firstSelection
    );

    expect(nextSelection?.target).toBe(newer);
  });

  it("cycles back to latest after the oldest message", () => {
    const first = document.createElement("article");
    const latest = document.createElement("article");
    const navigator = createQuestionNavigator();

    expect(navigator.next([first, latest])?.target).toBe(latest);
    expect(navigator.next([first, latest])?.target).toBe(first);
    expect(navigator.next([first, latest])?.target).toBe(latest);
  });
});
