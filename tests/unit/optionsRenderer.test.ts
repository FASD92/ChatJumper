// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_HIGHLIGHT_DURATION_MS,
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  type ChatJumperSettings
} from "../../src/shared/settings";
import type { SettingsStorageArea } from "../../src/shared/settingsStorage";
import { bootOptions } from "../../src/options";

describe("bootOptions", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("renders checkboxes and the highlight duration input from stored settings", async () => {
    const root = document.createElement("main");
    const storage = createFakeStorage({
      chatgptEnabled: false,
      highlightDurationMs: 1600
    });

    await bootOptions(root, storage);

    const checkboxes = getCheckboxes(root);
    const duration = getDurationInput(root);

    expect(checkboxes).toHaveLength(5);
    expect(checkboxes.map((checkbox) => checkbox.checked)).toEqual([
      true,
      true,
      true,
      true,
      false
    ]);
    expect(duration.value).toBe("1600");
  });

  it("stores checkbox changes and normalized duration changes", async () => {
    const root = document.createElement("main");
    const storage = createFakeStorage(DEFAULT_SETTINGS);

    await bootOptions(root, storage);

    const [composerButton] = getCheckboxes(root);
    composerButton.checked = false;
    composerButton.dispatchEvent(new Event("change", { bubbles: true }));
    await settleAsync();

    expect(storage.set).toHaveBeenCalledWith({
      [SETTINGS_STORAGE_KEY]: {
        ...DEFAULT_SETTINGS,
        composerButtonEnabled: false
      }
    });

    const duration = getDurationInput(root);
    duration.value = "9999";
    duration.dispatchEvent(new Event("change", { bubbles: true }));
    await settleAsync();

    expect(storage.set).toHaveBeenLastCalledWith({
      [SETTINGS_STORAGE_KEY]: {
        ...DEFAULT_SETTINGS,
        composerButtonEnabled: false,
        highlightDurationMs: DEFAULT_HIGHLIGHT_DURATION_MS
      }
    });
    expect(duration.value).toBe(String(DEFAULT_HIGHLIGHT_DURATION_MS));
  });

  it("reverts changed inputs and shows failure status when storage write fails", async () => {
    const root = document.createElement("main");
    const storage = createFailingStorage({
      ...DEFAULT_SETTINGS,
      highlightDurationMs: 1500
    });

    await bootOptions(root, storage);

    const [composerButton] = getCheckboxes(root);
    composerButton.checked = false;
    composerButton.dispatchEvent(new Event("change", { bubbles: true }));
    await settleAsync();

    expect(composerButton.checked).toBe(true);
    expect(root.querySelector(".cj-options__status")?.textContent).toBe(
      "Save failed."
    );

    const duration = getDurationInput(root);
    duration.value = "1700";
    duration.dispatchEvent(new Event("change", { bubbles: true }));
    await settleAsync();

    expect(duration.value).toBe("1500");
    expect(root.querySelector(".cj-options__status")?.textContent).toBe(
      "Save failed."
    );
  });
});

function getCheckboxes(root: HTMLElement): HTMLInputElement[] {
  return Array.from(
    root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
  );
}

function getDurationInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector<HTMLInputElement>(".cj-duration__input");

  if (!input) {
    throw new Error("Expected highlight duration input to render.");
  }

  return input;
}

function createFakeStorage(
  settings: Partial<ChatJumperSettings>
): SettingsStorageArea {
  const data: Record<string, unknown> = {
    [SETTINGS_STORAGE_KEY]: {
      ...DEFAULT_SETTINGS,
      ...settings
    }
  };

  return {
    get: vi.fn(async (key: string) => ({
      [key]: data[key]
    })),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(data, items);
    })
  };
}

function createFailingStorage(settings: ChatJumperSettings): SettingsStorageArea {
  return {
    get: vi.fn(async (key: string) => ({
      [key]: {
        ...settings
      }
    })),
    set: vi.fn(async () => {
      throw new Error("storage unavailable");
    })
  };
}

async function settleAsync(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}
