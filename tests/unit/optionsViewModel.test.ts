import { describe, expect, it } from "vitest";
import {
  DEFAULT_HIGHLIGHT_DURATION_MS,
  DEFAULT_SETTINGS,
  MAX_HIGHLIGHT_DURATION_MS,
  MIN_HIGHLIGHT_DURATION_MS
} from "../../src/shared/settings";
import {
  getHighlightDurationControl,
  getOptionsToggleRows,
  OPTIONS_TOGGLE_KEYS
} from "../../src/options/viewModel";

describe("getOptionsToggleRows", () => {
  it("exposes all decided Options Page boolean settings", () => {
    expect(OPTIONS_TOGGLE_KEYS).toEqual([
      "composerButtonEnabled",
      "highlightEnabled",
      "toastFeedbackEnabled",
      "smoothScrollEnabled",
      "chatgptEnabled"
    ]);
  });

  it("maps settings into Options Page labels and checked states", () => {
    const rows = getOptionsToggleRows({
      ...DEFAULT_SETTINGS,
      chatgptEnabled: false
    });

    expect(rows.map((row) => row.label)).toEqual([
      "Composer Button",
      "Highlight after jump",
      "Failure toast",
      "Smooth scroll",
      "ChatGPT support"
    ]);
    expect(rows.find((row) => row.key === "chatgptEnabled")?.checked).toBe(
      false
    );
  });
});

describe("getHighlightDurationControl", () => {
  it("returns highlight duration input metadata", () => {
    expect(getHighlightDurationControl(DEFAULT_SETTINGS)).toEqual({
      key: "highlightDurationMs",
      label: "Highlight duration",
      description: "How long the latest question stays highlighted after a jump.",
      value: DEFAULT_HIGHLIGHT_DURATION_MS,
      min: MIN_HIGHLIGHT_DURATION_MS,
      max: MAX_HIGHLIGHT_DURATION_MS,
      step: 100
    });
  });
});
