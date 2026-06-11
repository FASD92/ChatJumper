import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("GitHub Actions CI", () => {
  it("runs tests, lint, build, release zip, and uploads the artifact", () => {
    const workflowPath = join(process.cwd(), ".github/workflows/ci.yml");
    expect(statSync(workflowPath).isFile()).toBe(true);

    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("npm test");
    expect(workflow).toContain("npm run lint");
    expect(workflow).toContain("npm run build");
    expect(workflow).toContain("npm run release:zip");
    expect(workflow).toContain("actions/upload-artifact");
    expect(workflow).toContain("artifacts/chatjumper-v*.zip");
  });
});
