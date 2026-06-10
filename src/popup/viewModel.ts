import type { ChatJumperSettings } from "../shared/settings";

export type PopupBooleanSettingKey =
  | "composerButtonEnabled"
  | "highlightEnabled"
  | "toastFeedbackEnabled"
  | "currentSiteEnabled"
  | "smoothScrollEnabled";

export interface PopupToggleRow {
  key: PopupBooleanSettingKey;
  label: string;
  description: string;
  checked: boolean;
}

export const POPUP_TOGGLE_KEYS: readonly PopupBooleanSettingKey[] = [
  "composerButtonEnabled",
  "highlightEnabled",
  "toastFeedbackEnabled",
  "currentSiteEnabled",
  "smoothScrollEnabled"
];

const POPUP_TOGGLE_COPY: Record<
  PopupBooleanSettingKey,
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
  currentSiteEnabled: {
    label: "Enable on this site",
    description: "Allow ChatJumper to run on the current supported site."
  },
  smoothScrollEnabled: {
    label: "Smooth scroll",
    description: "Animate movement to the latest question."
  }
};

export function getPopupToggleRows(
  settings: ChatJumperSettings
): PopupToggleRow[] {
  return POPUP_TOGGLE_KEYS.map((key) => ({
    key,
    label: POPUP_TOGGLE_COPY[key].label,
    description: POPUP_TOGGLE_COPY[key].description,
    checked: settings[key]
  }));
}
