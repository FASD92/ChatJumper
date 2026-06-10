// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHATJUMPER_STYLE_MARKER,
  CHATJUMPER_TOAST_CLASS,
  ensureContentStyles,
  showToast
} from "../../src/content/feedback";

describe("content feedback", () => {
  beforeEach(() => {
    document.head.replaceChildren();
    document.body.replaceChildren();
  });

  it("injects content styles once", () => {
    ensureContentStyles(document);
    ensureContentStyles(document);

    const styles = document.head.querySelectorAll(
      `style[${CHATJUMPER_STYLE_MARKER}]`
    );

    expect(styles).toHaveLength(1);
    expect(styles[0].textContent).toContain("background: #6d28d9");
    expect(styles[0].textContent).toContain("color: #fde047");
  });

  it("shows one toast and removes it after the delay", () => {
    const scheduledCallbacks: Array<() => void> = [];
    const scheduleTimeout = vi.fn((callback: () => void, _delayMs: number) => {
      scheduledCallbacks.push(callback);
    });

    showToast("Could not find your latest question.", {
      root: document,
      scheduleTimeout
    });
    showToast("Still not found.", {
      root: document,
      scheduleTimeout
    });

    const toasts = document.body.querySelectorAll(`.${CHATJUMPER_TOAST_CLASS}`);

    expect(toasts).toHaveLength(1);
    expect(toasts[0].textContent).toBe("Still not found.");

    scheduledCallbacks.at(-1)?.();

    expect(document.body.querySelector(`.${CHATJUMPER_TOAST_CLASS}`)).toBeNull();
  });

  it("keeps a refreshed toast when an older removal callback fires", () => {
    const scheduledCallbacks: Array<() => void> = [];
    const scheduleTimeout = vi.fn((callback: () => void, _delayMs: number) => {
      scheduledCallbacks.push(callback);
    });

    showToast("First message.", {
      root: document,
      scheduleTimeout
    });
    showToast("Second message.", {
      root: document,
      scheduleTimeout
    });

    scheduledCallbacks[0]();

    const toast = document.body.querySelector(`.${CHATJUMPER_TOAST_CLASS}`);
    expect(toast?.textContent).toBe("Second message.");

    scheduledCallbacks[1]();

    expect(document.body.querySelector(`.${CHATJUMPER_TOAST_CLASS}`)).toBeNull();
  });
});
