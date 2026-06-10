// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHATJUMPER_COMPOSER_BUTTON_CLASS,
  syncComposerButton
} from "../../src/content/composerButton";

describe("syncComposerButton", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("inserts one J button immediately after the ChatGPT voice button", () => {
    const onClick = vi.fn();
    const voiceButton = createComposerWithVoiceButton();

    const button = syncComposerButton({
      root: document,
      enabled: true,
      onClick
    });

    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button?.textContent).toBe("J");
    expect(button?.classList.contains(CHATJUMPER_COMPOSER_BUTTON_CLASS)).toBe(
      true
    );
    expect(button?.getAttribute("aria-label")).toBe("Jump to latest question");
    expect(button?.getAttribute("title")).toBe("Jump to latest question");
    expect(voiceButton.nextElementSibling).toBe(button);

    button?.click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("ignores an earlier voice button that is not inside a composer form", () => {
    const unrelatedVoiceButton = document.createElement("button");
    unrelatedVoiceButton.setAttribute("aria-label", "Voice mode");
    document.body.append(unrelatedVoiceButton);
    const composerVoiceButton = createComposerWithVoiceButton();

    const button = syncComposerButton({
      root: document,
      enabled: true,
      onClick: vi.fn()
    });

    expect(unrelatedVoiceButton.nextElementSibling).not.toBe(button);
    expect(composerVoiceButton.nextElementSibling).toBe(button);
  });

  it("reuses an existing button instead of inserting duplicates", () => {
    createComposerWithVoiceButton();

    const first = syncComposerButton({
      root: document,
      enabled: true,
      onClick: vi.fn()
    });
    const second = syncComposerButton({
      root: document,
      enabled: true,
      onClick: vi.fn()
    });

    expect(second).toBe(first);
    expect(document.querySelectorAll(`.${CHATJUMPER_COMPOSER_BUTTON_CLASS}`))
      .toHaveLength(1);
  });

  it("removes an existing button when disabled", () => {
    createComposerWithVoiceButton();

    syncComposerButton({
      root: document,
      enabled: true,
      onClick: vi.fn()
    });
    const disabledResult = syncComposerButton({
      root: document,
      enabled: false,
      onClick: vi.fn()
    });

    expect(disabledResult).toBeNull();
    expect(document.querySelector(`.${CHATJUMPER_COMPOSER_BUTTON_CLASS}`))
      .toBeNull();
  });

  it("does not insert a button when no composer voice button exists", () => {
    const button = syncComposerButton({
      root: document,
      enabled: true,
      onClick: vi.fn()
    });

    expect(button).toBeNull();
  });
});

function createComposerWithVoiceButton(): HTMLButtonElement {
  const form = document.createElement("form");
  const input = document.createElement("textarea");
  const voiceButton = document.createElement("button");

  voiceButton.type = "button";
  voiceButton.setAttribute("aria-label", "Voice mode");
  form.append(input, voiceButton);
  document.body.append(form);

  return voiceButton;
}
