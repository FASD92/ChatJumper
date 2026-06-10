import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  normalizeSettings,
  updateSettings,
  type ChatJumperSettings,
  type ChatJumperSettingsPatch
} from "./settings";

export interface SettingsStorageArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export async function readSettings(
  storageArea: SettingsStorageArea = chrome.storage.local
): Promise<ChatJumperSettings> {
  const result = await storageArea.get(SETTINGS_STORAGE_KEY);
  return normalizeSettings(result[SETTINGS_STORAGE_KEY]);
}

export async function writeSettings(
  patch: ChatJumperSettingsPatch,
  storageArea: SettingsStorageArea = chrome.storage.local
): Promise<ChatJumperSettings> {
  const current = await readSettings(storageArea);
  const next = updateSettings(current, patch);

  await storageArea.set({
    [SETTINGS_STORAGE_KEY]: next
  });

  return next;
}

export async function resetSettings(
  storageArea: SettingsStorageArea = chrome.storage.local
): Promise<ChatJumperSettings> {
  await storageArea.set({
    [SETTINGS_STORAGE_KEY]: DEFAULT_SETTINGS
  });

  return DEFAULT_SETTINGS;
}
