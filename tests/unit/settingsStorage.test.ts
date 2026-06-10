import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY
} from "../../src/shared/settings";
import {
  readSettings,
  resetSettings,
  writeSettings,
  type SettingsStorageArea
} from "../../src/shared/settingsStorage";

describe("settingsStorage", () => {
  it("reads normalized defaults when the key is missing", async () => {
    const storage = createFakeStorage({});

    await expect(readSettings(storage)).resolves.toEqual(DEFAULT_SETTINGS);
    expect(storage.get).toHaveBeenCalledWith(SETTINGS_STORAGE_KEY);
  });

  it("reads normalized stored settings", async () => {
    const storage = createFakeStorage({
      [SETTINGS_STORAGE_KEY]: {
        composerButtonEnabled: false,
        highlightDurationMs: 1800
      }
    });

    await expect(readSettings(storage)).resolves.toEqual({
      ...DEFAULT_SETTINGS,
      composerButtonEnabled: false,
      highlightDurationMs: 1800
    });
  });

  it("writes a normalized patch on top of existing settings", async () => {
    const storage = createFakeStorage({
      [SETTINGS_STORAGE_KEY]: {
        composerButtonEnabled: false
      }
    });

    await writeSettings(
      {
        highlightEnabled: false,
        highlightDurationMs: 1600
      },
      storage
    );

    expect(storage.set).toHaveBeenCalledWith({
      [SETTINGS_STORAGE_KEY]: {
        ...DEFAULT_SETTINGS,
        composerButtonEnabled: false,
        highlightEnabled: false,
        highlightDurationMs: 1600
      }
    });
  });

  it("resets settings back to defaults", async () => {
    const storage = createFakeStorage({
      [SETTINGS_STORAGE_KEY]: {
        composerButtonEnabled: false
      }
    });

    await resetSettings(storage);

    expect(storage.set).toHaveBeenCalledWith({
      [SETTINGS_STORAGE_KEY]: DEFAULT_SETTINGS
    });
  });

  it("resets with a fresh defaults object", async () => {
    const storage = createFakeStorage({
      [SETTINGS_STORAGE_KEY]: {
        composerButtonEnabled: false
      }
    });

    const reset = await resetSettings(storage);
    const stored = vi.mocked(storage.set).mock.calls[0]?.[0][
      SETTINGS_STORAGE_KEY
    ];

    expect(reset).toEqual(DEFAULT_SETTINGS);
    expect(stored).toEqual(DEFAULT_SETTINGS);
    expect(reset).not.toBe(DEFAULT_SETTINGS);
    expect(stored).not.toBe(DEFAULT_SETTINGS);
  });
});

function createFakeStorage(
  initialData: Record<string, unknown>
): SettingsStorageArea {
  const data = { ...initialData };

  return {
    get: vi.fn(async (key: string) => ({
      [key]: data[key]
    })),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(data, items);
    })
  };
}
