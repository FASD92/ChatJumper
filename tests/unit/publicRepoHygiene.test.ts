import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const localOnlyPaths = [
  "AGENTS.md",
  "CONTEXT.md",
  "docs/adr/0001-first-launch-chatgpt-only.md",
  "docs/adr/0002-local-only-settings-and-no-backend.md",
  "docs/adr/0003-static-product-site.md",
  "docs/release-plan.md",
  "docs/superpowers/plans/2026-06-10-settings-surfaces.md",
  "docs/superpowers/plans/2026-06-11-release-readiness.md",
  "docs/superpowers/specs/2026-06-11-release-readiness-design.md",
  "docs_spec_ChatJumper.md"
] as const;

describe("public repository hygiene", () => {
  it("keeps implementation planning and agent-local files out of tracked public files", () => {
    const trackedFiles = execFileSync("git", ["ls-files"], {
      cwd: process.cwd(),
      encoding: "utf8"
    });

    for (const path of localOnlyPaths) {
      expect(trackedFiles).not.toContain(`${path}\n`);
    }
  });

  it("ignores local planning and agent files after they are untracked", () => {
    const gitignore = readFileSync(join(process.cwd(), ".gitignore"), "utf8");

    expect(gitignore).toContain("AGENTS.md");
    expect(gitignore).toContain("CONTEXT.md");
    expect(gitignore).toContain("docs/adr/");
    expect(gitignore).toContain("docs/release-plan.md");
    expect(gitignore).toContain("docs/superpowers/");
    expect(gitignore).toContain("docs_spec_ChatJumper.md");
  });
});
