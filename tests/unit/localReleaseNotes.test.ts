import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("local release notes", () => {
  it("ignores docs local working notes", () => {
    const gitignore = readFileSync(join(process.cwd(), ".gitignore"), "utf8");

    expect(gitignore).toContain("docs/*.local.md");
    expect(gitignore).toContain("site/assets/raw/");
  });
});
