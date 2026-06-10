import { describe, expect, it } from "vitest";
import {
  DEFAULT_HIGHLIGHT_DURATION_MS,
  DEFAULT_SETTINGS,
  MAX_HIGHLIGHT_DURATION_MS,
  MIN_HIGHLIGHT_DURATION_MS,
  normalizeSettings,
  updateSettings
} from "../../src/shared/settings";

describe("normalizeSettings", () => {
  it("returns launch defaults when storage has no value", () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("preserves valid stored values over defaults", () => {
    expect(
      normalizeSettings({
        composerButtonEnabled: false,
        highlightEnabled: false,
        toastFeedbackEnabled: false,
        currentSiteEnabled: false,
        smoothScrollEnabled: false,
        chatgptEnabled: false,
        highlightDurationMs: 900
      })
    ).toEqual({
      composerButtonEnabled: false,
      highlightEnabled: false,
      toastFeedbackEnabled: false,
      currentSiteEnabled: false,
      smoothScrollEnabled: false,
      chatgptEnabled: false,
      highlightDurationMs: 900
    });
  });

  it("ignores invalid boolean values and keeps defaults", () => {
    expect(
      normalizeSettings({
        composerButtonEnabled: "false",
        highlightEnabled: 0,
        toastFeedbackEnabled: true
      })
    ).toEqual({
      ...DEFAULT_SETTINGS,
      toastFeedbackEnabled: true
    });
  });

  it("rejects highlight duration outside the supported range", () => {
    expect(
      normalizeSettings({ highlightDurationMs: MIN_HIGHLIGHT_DURATION_MS - 1 })
        .highlightDurationMs
    ).toBe(DEFAULT_HIGHLIGHT_DURATION_MS);

    expect(
      normalizeSettings({ highlightDurationMs: MAX_HIGHLIGHT_DURATION_MS + 1 })
        .highlightDurationMs
    ).toBe(DEFAULT_HIGHLIGHT_DURATION_MS);

    expect(
      normalizeSettings({ highlightDurationMs: 1500 }).highlightDurationMs
    ).toBe(1500);
  });
});

describe("updateSettings", () => {
  it("merges a patch and normalizes the result", () => {
    expect(
      updateSettings(DEFAULT_SETTINGS, {
        composerButtonEnabled: false,
        highlightDurationMs: 1600
      })
    ).toEqual({
      ...DEFAULT_SETTINGS,
      composerButtonEnabled: false,
      highlightDurationMs: 1600
    });
  });
});
