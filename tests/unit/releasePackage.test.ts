import { describe, expect, it } from "vitest";

const releasePackage = await import("../../scripts/releasePackage.mjs");

describe("release package helpers", () => {
  it("creates the release zip name from package version", () => {
    expect(releasePackage.createZipName("0.1.0")).toBe("chatjumper-v0.1.0.zip");
  });

  it("accepts matching package and manifest versions", () => {
    expect(() =>
      releasePackage.assertMatchingVersions(
        { version: "0.1.0" },
        { version: "0.1.0" }
      )
    ).not.toThrow();
  });

  it("rejects mismatched package and manifest versions", () => {
    expect(() =>
      releasePackage.assertMatchingVersions(
        { version: "0.1.0" },
        { version: "0.1.1" }
      )
    ).toThrow("package.json version 0.1.0 must match manifest version 0.1.1");
  });

  it("requires core dist entries", () => {
    expect(() =>
      releasePackage.assertDistEntries([
        "manifest.json",
        "background.js",
        "content.js",
        "popup.html",
        "popup.js",
        "options.html",
        "options.js",
        "icons"
      ])
    ).not.toThrow();

    expect(() =>
      releasePackage.assertDistEntries(["manifest.json", "content.js"])
    ).toThrow("dist is missing required release entry: background.js");
  });
});
