import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readProjectFile(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("GitHub issue templates", () => {
  it("provides public support templates", () => {
    const files = [
      ".github/ISSUE_TEMPLATE/bug_report.md",
      ".github/ISSUE_TEMPLATE/selector_drift.md",
      ".github/ISSUE_TEMPLATE/feature_request.md"
    ];

    for (const file of files) {
      expect(statSync(join(root, file)).isFile()).toBe(true);
    }
  });

  it("asks bug reporters for environment and reproduction details", () => {
    const template = readProjectFile(".github/ISSUE_TEMPLATE/bug_report.md");

    expect(template).toContain("ChatGPT URL shape");
    expect(template).toContain("Chrome version");
    expect(template).toContain("Steps to reproduce");
    expect(template).toContain("Expected behavior");
    expect(template).toContain("Actual behavior");
  });

  it("separates selector drift reports from general bugs", () => {
    const template = readProjectFile(".github/ISSUE_TEMPLATE/selector_drift.md");

    expect(template).toContain("Selector drift");
    expect(template).toContain("ChatGPT DOM changed");
    expect(template).toContain("Does the Composer Button appear?");
    expect(template).toContain("Does the highlight appear?");
  });

  it("keeps feature requests scoped to ChatJumper", () => {
    const template = readProjectFile(".github/ISSUE_TEMPLATE/feature_request.md");

    expect(template).toContain("What problem would this solve?");
    expect(template).toContain("Does this stay within ChatJumper's single-purpose scope?");
  });
});
