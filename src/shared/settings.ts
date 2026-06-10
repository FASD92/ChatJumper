export const SETTINGS_STORAGE_KEY = "chatJumper.settings.v1";

export const DEFAULT_HIGHLIGHT_DURATION_MS = 1200;
export const MIN_HIGHLIGHT_DURATION_MS = 400;
export const MAX_HIGHLIGHT_DURATION_MS = 3000;

export interface ChatJumperSettings {
  composerButtonEnabled: boolean;
  highlightEnabled: boolean;
  toastFeedbackEnabled: boolean;
  currentSiteEnabled: boolean;
  smoothScrollEnabled: boolean;
  chatgptEnabled: boolean;
  highlightDurationMs: number;
}

export type ChatJumperSettingsPatch = Partial<ChatJumperSettings>;

export const DEFAULT_SETTINGS: ChatJumperSettings = {
  composerButtonEnabled: true,
  highlightEnabled: true,
  toastFeedbackEnabled: true,
  currentSiteEnabled: true,
  smoothScrollEnabled: true,
  chatgptEnabled: true,
  highlightDurationMs: DEFAULT_HIGHLIGHT_DURATION_MS
};

export function normalizeSettings(value: unknown): ChatJumperSettings {
  if (!isRecord(value)) {
    return DEFAULT_SETTINGS;
  }

  return {
    composerButtonEnabled: readBoolean(
      value,
      "composerButtonEnabled",
      DEFAULT_SETTINGS.composerButtonEnabled
    ),
    highlightEnabled: readBoolean(
      value,
      "highlightEnabled",
      DEFAULT_SETTINGS.highlightEnabled
    ),
    toastFeedbackEnabled: readBoolean(
      value,
      "toastFeedbackEnabled",
      DEFAULT_SETTINGS.toastFeedbackEnabled
    ),
    currentSiteEnabled: readBoolean(
      value,
      "currentSiteEnabled",
      DEFAULT_SETTINGS.currentSiteEnabled
    ),
    smoothScrollEnabled: readBoolean(
      value,
      "smoothScrollEnabled",
      DEFAULT_SETTINGS.smoothScrollEnabled
    ),
    chatgptEnabled: readBoolean(
      value,
      "chatgptEnabled",
      DEFAULT_SETTINGS.chatgptEnabled
    ),
    highlightDurationMs: readHighlightDuration(value)
  };
}

export function updateSettings(
  current: ChatJumperSettings,
  patch: ChatJumperSettingsPatch
): ChatJumperSettings {
  return normalizeSettings({
    ...current,
    ...patch
  });
}

function readBoolean(
  value: Record<string, unknown>,
  key: keyof ChatJumperSettings,
  fallback: boolean
): boolean {
  const candidate = value[key];
  return typeof candidate === "boolean" ? candidate : fallback;
}

function readHighlightDuration(value: Record<string, unknown>): number {
  const candidate = value.highlightDurationMs;

  if (
    typeof candidate === "number" &&
    Number.isInteger(candidate) &&
    candidate >= MIN_HIGHLIGHT_DURATION_MS &&
    candidate <= MAX_HIGHLIGHT_DURATION_MS
  ) {
    return candidate;
  }

  return DEFAULT_SETTINGS.highlightDurationMs;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
