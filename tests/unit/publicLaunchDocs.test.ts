import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readProjectFile(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("public launch documentation", () => {
  it("provides a public README for repository visitors", () => {
    const readme = readProjectFile("README.md");

    expect(readme).toContain("# ChatJumper");
    expect(readme).toContain("ChatGPT");
    expect(readme).toContain("Gemini and Claude are coming soon");
    expect(readme).toContain("npm test");
    expect(readme).toContain("npm run lint");
    expect(readme).toContain("npm run build");
    expect(readme).toContain("cdrootdev@gmail.com");
    expect(readme).toContain("https://github.com/FASD92/ChatJumper/issues");
  });

  it("provides a public-safe Store submission pack", () => {
    expect(statSync(join(root, "docs/store-submission-pack.md")).isFile()).toBe(true);

    const pack = readProjectFile("docs/store-submission-pack.md");

    expect(pack).toContain("Stop losing your place in long ChatGPT chats.");
    expect(pack).toContain("Productivity");
    expect(pack).toContain("storage");
    expect(pack).toContain("https://chatgpt.com/*");
    expect(pack).toContain("No backend");
    expect(pack).toContain("No analytics");
    expect(pack).toContain("No test account is required");
    expect(pack).toContain("Korean Draft");
  });

  it("documents Chrome Web Store dashboard fields and launch assets", () => {
    const pack = readProjectFile("docs/store-submission-pack.md");

    expect(pack).toContain("Homepage URL: https://fasd92.github.io/ChatJumper/");
    expect(pack).toContain(
      "Privacy Policy URL: https://fasd92.github.io/ChatJumper/privacy/"
    );
    expect(pack).toContain(
      "Support URL: https://fasd92.github.io/ChatJumper/support/"
    );
    expect(pack).toContain("No, I am not using remote code");
    expect(pack).toContain("No user data collected");
    expect(pack).toContain("1280x800 px screenshot");
    expect(pack).toContain("440x280 px small promo tile");
    expect(pack).toContain("1400x560 px marquee promo tile");
  });

  it("keeps local-only release material out of public docs", () => {
    for (const file of ["README.md", "docs/store-submission-pack.md"]) {
      const text = readProjectFile(file);

      expect(text).not.toContain("docs/release.local.md");
      expect(text).not.toContain("docs/store-submission.local.md");
      expect(text).not.toContain("Store Console progress");
      expect(text).not.toContain("reviewer response log");
    }
  });
});
