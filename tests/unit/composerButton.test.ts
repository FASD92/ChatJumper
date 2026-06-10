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

  it("renders a floating J button without touching composer controls", () => {
    const onClick = vi.fn();
    const { form, voiceButton } = createComposerWithVoiceButton();

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
    expect(button?.parentElement).toBe(document.body);
    expect(form.contains(button)).toBe(false);
    expect(voiceButton.nextElementSibling).toBeNull();
    expect(button?.style.position).toBe("fixed");
    expect(button?.style.right).toBe("24px");
    expect(button?.style.bottom).toBe("112px");
    expect(button?.style.width).toBe("52px");
    expect(button?.style.height).toBe("52px");

    button?.click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("ignores an earlier voice button that is not inside a composer form", () => {
    const unrelatedVoiceButton = document.createElement("button");
    unrelatedVoiceButton.setAttribute("aria-label", "Voice mode");
    document.body.append(unrelatedVoiceButton);
    const { form, voiceButton } = createComposerWithVoiceButton();

    const button = syncComposerButton({
      root: document,
      enabled: true,
      onClick: vi.fn()
    });

    expect(unrelatedVoiceButton.nextElementSibling).not.toBe(button);
    expect(form.contains(button)).toBe(false);
    expect(voiceButton.nextElementSibling).toBeNull();
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

  it("renders a floating button even when no composer voice button exists", () => {
    const button = syncComposerButton({
      root: document,
      enabled: true,
      onClick: vi.fn()
    });

    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button?.parentElement).toBe(document.body);
  });
});

function createComposerWithVoiceButton(): {
  form: HTMLFormElement;
  voiceButton: HTMLButtonElement;
} {
  const form = document.createElement("form");
  const input = document.createElement("textarea");
  const voiceButton = document.createElement("button");

  voiceButton.type = "button";
  voiceButton.setAttribute("aria-label", "Voice mode");
  form.append(input, voiceButton);
  document.body.append(form);

  return {
    form,
    voiceButton
  };
}
