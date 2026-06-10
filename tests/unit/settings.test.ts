import { describe, expect, it } from "vitest";
import {
  DEFAULT_HIGHLIGHT_DURATION_MS,
  DEFAULT_SETTINGS,
  MAX_HIGHLIGHT_DURATION_MS,
  MIN_HIGHLIGHT_DURATION_MS,
  createDefaultSettings,
  normalizeSettings,
  updateSettings
} from "../../src/shared/settings";

describe("normalizeSettings", () => {
  it("returns launch defaults when storage has no value", () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("returns fresh default objects when storage has no value", () => {
    const fromUndefined = normalizeSettings(undefined);
    const fromNull = normalizeSettings(null);

    expect(fromUndefined).toEqual(DEFAULT_SETTINGS);
    expect(fromNull).toEqual(DEFAULT_SETTINGS);
    expect(fromUndefined).not.toBe(DEFAULT_SETTINGS);
    expect(fromNull).not.toBe(DEFAULT_SETTINGS);
    expect(fromUndefined).not.toBe(fromNull);
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

describe("createDefaultSettings", () => {
  it("returns a fresh object with launch defaults", () => {
    const first = createDefaultSettings();
    const second = createDefaultSettings();

    expect(first).toEqual(DEFAULT_SETTINGS);
    expect(second).toEqual(DEFAULT_SETTINGS);
    expect(first).not.toBe(DEFAULT_SETTINGS);
    expect(second).not.toBe(DEFAULT_SETTINGS);
    expect(first).not.toBe(second);
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
