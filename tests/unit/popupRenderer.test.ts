// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  type ChatJumperSettings
} from "../../src/shared/settings";
import type { SettingsStorageArea } from "../../src/shared/settingsStorage";
import { bootPopup } from "../../src/popup";

describe("bootPopup", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("renders five checkboxes from stored settings", async () => {
    const root = document.createElement("main");
    const storage = createFakeStorage({
      composerButtonEnabled: false,
      smoothScrollEnabled: false
    });

    await bootPopup(root, storage);

    const checkboxes = getCheckboxes(root);
    expect(checkboxes).toHaveLength(5);
    expect(checkboxes.map((checkbox) => checkbox.checked)).toEqual([
      false,
      true,
      true,
      true,
      false
    ]);
  });

  it("stores the changed checkbox key", async () => {
    const root = document.createElement("main");
    const storage = createFakeStorage(DEFAULT_SETTINGS);

    await bootPopup(root, storage);

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
  });

  it("reverts a checkbox and shows failure status when storage write fails", async () => {
    const root = document.createElement("main");
    const storage = createFailingStorage(DEFAULT_SETTINGS);

    await bootPopup(root, storage);

    const [composerButton] = getCheckboxes(root);
    composerButton.checked = false;
    composerButton.dispatchEvent(new Event("change", { bubbles: true }));
    await settleAsync();

    expect(composerButton.checked).toBe(true);
    expect(root.querySelector(".cj-popup__status")?.textContent).toBe(
      "Save failed."
    );
  });
});

function getCheckboxes(root: HTMLElement): HTMLInputElement[] {
  return Array.from(
    root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
  );
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

function createFailingStorage(
  settings: ChatJumperSettings
): SettingsStorageArea {
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
