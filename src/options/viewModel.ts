import {
  MAX_HIGHLIGHT_DURATION_MS,
  MIN_HIGHLIGHT_DURATION_MS,
  type ChatJumperSettings
} from "../shared/settings";

export type OptionsBooleanSettingKey =
  | "composerButtonEnabled"
  | "highlightEnabled"
  | "toastFeedbackEnabled"
  | "smoothScrollEnabled"
  | "chatgptEnabled";

export interface OptionsToggleRow {
  key: OptionsBooleanSettingKey;
  label: string;
  description: string;
  checked: boolean;
}

export interface HighlightDurationControl {
  key: "highlightDurationMs";
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
}

export const OPTIONS_TOGGLE_KEYS: readonly OptionsBooleanSettingKey[] = [
  "composerButtonEnabled",
  "highlightEnabled",
  "toastFeedbackEnabled",
  "smoothScrollEnabled",
  "chatgptEnabled"
];

const OPTIONS_TOGGLE_COPY: Record<
  OptionsBooleanSettingKey,
  { label: string; description: string }
> = {
  composerButtonEnabled: {
    label: "Composer Button",
    description: "Show the J button near the ChatGPT composer."
  },
  highlightEnabled: {
    label: "Highlight after jump",
    description: "Flash the latest question after ChatJumper moves."
  },
  toastFeedbackEnabled: {
    label: "Failure toast",
    description: "Show a short message when no target is found."
  },
  smoothScrollEnabled: {
    label: "Smooth scroll",
    description: "Animate movement to the latest question."
  },
  chatgptEnabled: {
    label: "ChatGPT support",
    description: "Allow ChatJumper to run on chatgpt.com."
  }
};

export function getOptionsToggleRows(
  settings: ChatJumperSettings
): OptionsToggleRow[] {
  return OPTIONS_TOGGLE_KEYS.map((key) => ({
    key,
    label: OPTIONS_TOGGLE_COPY[key].label,
    description: OPTIONS_TOGGLE_COPY[key].description,
    checked: settings[key]
  }));
}

export function getHighlightDurationControl(
  settings: ChatJumperSettings
): HighlightDurationControl {
  return {
    key: "highlightDurationMs",
    label: "Highlight duration",
    description: "How long the latest question stays highlighted after a jump.",
    value: settings.highlightDurationMs,
    min: MIN_HIGHLIGHT_DURATION_MS,
    max: MAX_HIGHLIGHT_DURATION_MS,
    step: 100
  };
}
