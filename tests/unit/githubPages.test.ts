import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("GitHub Pages workflow", () => {
  it("deploys the static Product Site from site/", () => {
    const workflowPath = join(process.cwd(), ".github/workflows/pages.yml");
    expect(statSync(workflowPath).isFile()).toBe(true);

    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toContain("permissions:");
    expect(workflow).toContain("pages: write");
    expect(workflow).toContain("id-token: write");
    expect(workflow).toContain("actions/configure-pages");
    expect(workflow).toContain("actions/upload-pages-artifact");
    expect(workflow).toContain("path: site");
    expect(workflow).toContain("actions/deploy-pages");
  });
});
