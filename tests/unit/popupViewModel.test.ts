import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../../src/shared/settings";
import {
  getPopupToggleRows,
  POPUP_TOGGLE_KEYS
} from "../../src/popup/viewModel";

describe("getPopupToggleRows", () => {
  it("exposes exactly the five decided Popup quick settings", () => {
    expect(POPUP_TOGGLE_KEYS).toEqual([
      "composerButtonEnabled",
      "highlightEnabled",
      "toastFeedbackEnabled",
      "currentSiteEnabled",
      "smoothScrollEnabled"
    ]);
  });

  it("maps settings into stable Popup row labels and checked states", () => {
    const rows = getPopupToggleRows({
      ...DEFAULT_SETTINGS,
      composerButtonEnabled: false,
      smoothScrollEnabled: false
    });

    expect(rows).toEqual([
      {
        key: "composerButtonEnabled",
        label: "Composer Button",
        description: "Show the J button near the ChatGPT composer.",
        checked: false
      },
      {
        key: "highlightEnabled",
        label: "Highlight after jump",
        description: "Flash the latest question after ChatJumper moves.",
        checked: true
      },
      {
        key: "toastFeedbackEnabled",
        label: "Failure toast",
        description: "Show a short message when no target is found.",
        checked: true
      },
      {
        key: "currentSiteEnabled",
        label: "Enable on this site",
        description: "Allow ChatJumper to run on the current supported site.",
        checked: true
      },
      {
        key: "smoothScrollEnabled",
        label: "Smooth scroll",
        description: "Animate movement to the latest question.",
        checked: false
      }
    ]);
  });
});
