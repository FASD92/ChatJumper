import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

const siteFiles = [
  "site/index.html",
  "site/privacy/index.html",
  "site/support/index.html",
  "site/ko/index.html",
  "site/ko/privacy/index.html",
  "site/ko/support/index.html",
  "site/styles.css"
] as const;

const assetFiles = [
  "site/icons/icon-128.png",
  "site/assets/chatgpt-lorem-screenshot.png"
] as const;

function readProjectFile(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("Product Site", () => {
  it("provides the required English and Korean static pages", () => {
    for (const file of siteFiles) {
      expect(statSync(join(root, file)).isFile()).toBe(true);
    }
  });

  it("publishes site-local visual assets used by the home pages", () => {
    for (const file of assetFiles) {
      expect(statSync(join(root, file)).isFile()).toBe(true);
    }

    const englishHome = readProjectFile("site/index.html");
    const koreanHome = readProjectFile("site/ko/index.html");

    expect(englishHome).toContain('src="/icons/icon-128.png"');
    expect(englishHome).toContain('src="/assets/chatgpt-lorem-screenshot.png"');
    expect(koreanHome).toContain('src="/icons/icon-128.png"');
    expect(koreanHome).toContain('src="/assets/chatgpt-lorem-screenshot.png"');
  });

  it("uses English root URLs and Korean /ko URLs", () => {
    const englishHome = readProjectFile("site/index.html");
    const koreanHome = readProjectFile("site/ko/index.html");

    expect(englishHome).toContain('lang="en"');
    expect(englishHome).toContain('href="/privacy/"');
    expect(englishHome).toContain('href="/support/"');
    expect(englishHome).toContain('href="/ko/"');
    expect(koreanHome).toContain('lang="ko"');
    expect(koreanHome).toContain('href="/ko/privacy/"');
    expect(koreanHome).toContain('href="/ko/support/"');
    expect(koreanHome).toContain('href="/"');
  });

  it("communicates launch scope and pre-store state", () => {
    const englishHome = readProjectFile("site/index.html");
    const koreanHome = readProjectFile("site/ko/index.html");

    expect(englishHome).toContain("Coming soon on Chrome Web Store");
    expect(englishHome).toContain("ChatGPT");
    expect(englishHome).toContain("Gemini and Claude are coming soon");
    expect(koreanHome).toContain("Chrome Web Store 공개 예정");
    expect(koreanHome).toContain("ChatGPT");
    expect(koreanHome).toContain("Gemini와 Claude는 지원 예정");
  });

  it("states privacy requirements on both privacy pages", () => {
    const englishPrivacy = readProjectFile("site/privacy/index.html");
    const koreanPrivacy = readProjectFile("site/ko/privacy/index.html");

    expect(englishPrivacy).toContain("does not store chat content");
    expect(englishPrivacy).toContain("does not send chat content to any server");
    expect(englishPrivacy).toContain("does not use analytics");
    expect(englishPrivacy).toContain("chrome.storage.local");
    expect(koreanPrivacy).toContain("채팅 원문을 저장하지 않습니다");
    expect(koreanPrivacy).toContain("외부 서버로 전송하지 않습니다");
    expect(koreanPrivacy).toContain("analytics를 사용하지 않습니다");
    expect(koreanPrivacy).toContain("chrome.storage.local");
  });

  it("publishes support channels", () => {
    const englishSupport = readProjectFile("site/support/index.html");
    const koreanSupport = readProjectFile("site/ko/support/index.html");

    expect(englishSupport).toContain("https://github.com/FASD92/ChatJumper/issues");
    expect(englishSupport).toContain("cdrootdev@gmail.com");
    expect(koreanSupport).toContain("https://github.com/FASD92/ChatJumper/issues");
    expect(koreanSupport).toContain("cdrootdev@gmail.com");
  });

  it("does not expose local-only release notes or fake install links", () => {
    for (const file of siteFiles) {
      const text = readProjectFile(file);

      expect(text).not.toContain("docs/release.local.md");
      expect(text).not.toContain("docs/store-submission.local.md");
      expect(text).not.toContain("support@example.com");
      expect(text).not.toContain('href="#"');
    }
  });
});
