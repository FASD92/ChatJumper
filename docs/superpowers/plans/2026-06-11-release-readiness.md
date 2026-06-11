# Release Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare ChatJumper for a public GitHub Pages Product Site, public repository launch surface, Chrome Web Store submission package, CI verification, and release zip artifact generation.

**Architecture:** Keep the extension runtime unchanged. Add static public surfaces under `site/`, public repository support files under `README.md` and `.github/ISSUE_TEMPLATE/`, release/package automation under `scripts/`, and verification tests under `tests/unit/`. GitHub Pages is configured by the user from `main` branch `/site`; GitHub Actions verifies and packages the extension but does not deploy the Product Site.

**Tech Stack:** TypeScript, Vitest, Vite, Node ESM scripts, static HTML/CSS, GitHub Actions, Chrome Manifest V3.

---

## File Structure

- Create `site/styles.css`: shared static Product Site styling.
- Create `site/index.html`: English Product Site home.
- Create `site/privacy/index.html`: English privacy policy.
- Create `site/support/index.html`: English support page.
- Create `site/ko/index.html`: Korean Product Site home.
- Create `site/ko/privacy/index.html`: Korean privacy policy.
- Create `site/ko/support/index.html`: Korean support page.
- Create `site/assets/README.md`: documents where user-supplied screenshot assets go without committing private raw screenshots.
- Create `tests/unit/productSite.test.ts`: verifies static site files, links, required privacy copy, support email, language structure, and absence of unsafe public-release tokens.
- Create `README.md`: public launch repository README.
- Create `docs/store-submission-pack.md`: public-safe Chrome Web Store copy pack.
- Create `tests/unit/publicLaunchDocs.test.ts`: verifies public README and store copy contain required launch claims and no local-only release notes.
- Create `.github/ISSUE_TEMPLATE/bug_report.md`: public bug report template.
- Create `.github/ISSUE_TEMPLATE/selector_drift.md`: ChatGPT DOM drift report template.
- Create `.github/ISSUE_TEMPLATE/feature_request.md`: feature request template.
- Create `tests/unit/issueTemplates.test.ts`: verifies templates exist and request required data.
- Modify `.gitignore`: add `docs/*.local.md` and local screenshot raw asset ignore paths.
- Create `docs/release.local.md`: ignored local release working note template. Do not commit this file.
- Create `docs/store-submission.local.md`: ignored local Store Console working note template. Do not commit this file.
- Create `tests/unit/localReleaseNotes.test.ts`: verifies `.gitignore` ignores local release notes.
- Create `scripts/releasePackage.mjs`: validates package/manifest version, verifies `dist`, and creates `artifacts/chatjumper-v<version>.zip`.
- Create `tests/unit/releasePackage.test.ts`: unit tests version matching, zip naming, and dist entry validation helpers.
- Modify `package.json`: add only the `release:zip` script and keep existing commands.
- Create `.github/workflows/ci.yml`: install, test, lint, build, release zip, upload artifact.
- Create `tests/unit/githubActions.test.ts`: verifies workflow commands and artifact naming.

---

## Task 1: Product Site Verification Tests

**Files:**
- Create: `tests/unit/productSite.test.ts`
- Task 2 creates the Product Site files this test expects.

- [ ] **Step 1: Write the failing Product Site test**

Create `tests/unit/productSite.test.ts`:

```ts
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

function readProjectFile(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("Product Site", () => {
  it("provides the required English and Korean static pages", () => {
    for (const file of siteFiles) {
      expect(statSync(join(root, file)).isFile()).toBe(true);
    }
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
      expect(text).not.toContain("href=\"#\"");
    }
  });
});
```

- [ ] **Step 2: Run the Product Site test to verify it fails**

Run:

```bash
npm test -- tests/unit/productSite.test.ts
```

Expected: FAIL because `site/` files do not exist yet.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/unit/productSite.test.ts
git commit -m "test: specify product site release surface"
```

---

## Task 2: Static Product Site

**Files:**
- Create: `site/styles.css`
- Create: `site/index.html`
- Create: `site/privacy/index.html`
- Create: `site/support/index.html`
- Create: `site/ko/index.html`
- Create: `site/ko/privacy/index.html`
- Create: `site/ko/support/index.html`
- Create: `site/assets/README.md`
- Test: `tests/unit/productSite.test.ts`

- [ ] **Step 1: Add shared Product Site CSS**

Create `site/styles.css`:

```css
:root {
  color-scheme: light;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  background: #fbf9ff;
  color: #20172f;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background:
    radial-gradient(circle at 18% 8%, rgba(156, 208, 255, 0.34), transparent 26rem),
    radial-gradient(circle at 88% 18%, rgba(245, 73, 255, 0.2), transparent 22rem),
    #fbf9ff;
}

a {
  color: #5c2bdc;
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.18em;
}

.site-shell {
  max-width: 1080px;
  margin: 0 auto;
  padding: 24px;
}

.site-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 48px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #20172f;
  font-weight: 800;
  text-decoration: none;
}

.brand img {
  width: 36px;
  height: 36px;
}

.nav-links {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 14px;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
  gap: 40px;
  align-items: center;
  margin-bottom: 56px;
}

.eyebrow {
  margin: 0 0 12px;
  color: #6d28d9;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  max-width: 720px;
  margin-bottom: 18px;
  font-size: clamp(44px, 8vw, 82px);
  line-height: 0.96;
}

h2 {
  font-size: clamp(28px, 4vw, 44px);
  line-height: 1.05;
}

.lead {
  max-width: 680px;
  color: #514461;
  font-size: 19px;
  line-height: 1.65;
}

.cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 999px;
  padding: 0 18px;
  background: #ffd43b;
  color: #25123f;
  font-weight: 800;
  text-decoration: none;
}

.button-secondary {
  background: rgba(109, 40, 217, 0.08);
  color: #4c1d95;
}

.hero-card {
  border: 1px solid rgba(109, 40, 217, 0.16);
  border-radius: 8px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 18px 50px rgba(64, 22, 122, 0.14);
}

.hero-card img {
  display: block;
  width: 100%;
  border-radius: 8px;
}

.section {
  margin: 56px 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.panel {
  border: 1px solid #e5def0;
  border-radius: 8px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
}

.panel p,
.doc p,
.doc li {
  color: #514461;
  line-height: 1.65;
}

.doc {
  max-width: 820px;
}

.doc h1 {
  font-size: clamp(36px, 5vw, 58px);
}

.footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid #e5def0;
  margin-top: 72px;
  padding-top: 24px;
  color: #6b617a;
  font-size: 14px;
}

@media (max-width: 780px) {
  .site-shell {
    padding: 18px;
  }

  .site-nav,
  .hero {
    grid-template-columns: 1fr;
  }

  .site-nav {
    align-items: flex-start;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Add English home**

Create `site/index.html`. Use the release icon at `/icons/icon-128.png`, the future screenshot path `/assets/chatgpt-lorem-screenshot.png`, and these exact public links:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ChatJumper - Jump back to your latest ChatGPT question</title>
    <meta
      name="description"
      content="ChatJumper helps you return to your latest question in long ChatGPT chats without storing or sending your conversations."
    />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div class="site-shell">
      <nav class="site-nav" aria-label="Primary">
        <a class="brand" href="/">
          <img src="/icons/icon-128.png" alt="" />
          <span>ChatJumper</span>
        </a>
        <div class="nav-links">
          <a href="/privacy/">Privacy</a>
          <a href="/support/">Support</a>
          <a href="/ko/">한국어</a>
          <a href="https://github.com/FASD92/ChatJumper">GitHub</a>
        </div>
      </nav>

      <main>
        <section class="hero">
          <div>
            <p class="eyebrow">Privacy-first Chrome extension</p>
            <h1>Jump back to your latest ChatGPT question.</h1>
            <p class="lead">
              ChatJumper keeps long ChatGPT conversations navigable with a
              floating Composer Button, keyboard shortcut, and visible highlight
              feedback.
            </p>
            <div class="cta-row">
              <a class="button" href="/support/">Coming soon on Chrome Web Store</a>
              <a class="button button-secondary" href="https://github.com/FASD92/ChatJumper">View source</a>
            </div>
          </div>
          <figure class="hero-card">
            <img
              src="/assets/chatgpt-lorem-screenshot.png"
              alt="ChatJumper highlighting a lorem ipsum question inside ChatGPT"
            />
          </figure>
        </section>

        <section class="section">
          <h2>Built for one job</h2>
          <div class="grid">
            <article class="panel">
              <h3>Composer Button</h3>
              <p>Click the ChatJumper button near the composer to move through your user questions.</p>
            </article>
            <article class="panel">
              <h3>Keyboard Shortcut</h3>
              <p>Use Alt+J on Windows/Linux or Command+J on macOS for the same jump behavior.</p>
            </article>
            <article class="panel">
              <h3>Highlight Feedback</h3>
              <p>After a jump, ChatJumper highlights the target question so you can reorient quickly.</p>
            </article>
          </div>
        </section>

        <section class="section">
          <h2>How it works</h2>
          <p class="lead">
            ChatJumper reads the current page DOM in your browser, identifies
            user-question positions in the open ChatGPT conversation, and scrolls
            locally. It does not replace search, export chats, or send content to
            a server.
          </p>
        </section>

        <section class="section">
          <h2>Privacy-first by default</h2>
          <div class="grid">
            <article class="panel"><h3>No chat storage</h3><p>ChatJumper does not store chat content.</p></article>
            <article class="panel"><h3>No server transfer</h3><p>Your conversation content is not sent to any server.</p></article>
            <article class="panel"><h3>No analytics</h3><p>The first launch does not include analytics or telemetry.</p></article>
          </div>
        </section>

        <section class="section">
          <h2>Supported site</h2>
          <p class="lead">ChatGPT is supported for the first launch. Gemini and Claude are coming soon.</p>
        </section>
      </main>

      <footer class="footer">
        <span>ChatJumper</span>
        <span><a href="/privacy/">Privacy</a> · <a href="/support/">Support</a></span>
      </footer>
    </div>
  </body>
</html>
```

- [ ] **Step 3: Add English privacy and support pages**

Create `site/privacy/index.html` and `site/support/index.html` with the same nav/footer pattern. The privacy page must include these exact sentences:

```html
<p>ChatJumper does not store chat content.</p>
<p>ChatJumper does not send chat content to any server.</p>
<p>ChatJumper does not use analytics.</p>
<p>ChatJumper stores user preferences only in chrome.storage.local.</p>
```

The support page must include:

```html
<p>For public bugs, selector drift reports, and feature requests, use GitHub Issues.</p>
<p><a href="https://github.com/FASD92/ChatJumper/issues">Open GitHub Issues</a></p>
<p>For privacy, Chrome Web Store, or non-developer support questions, email <a href="mailto:cdrootdev@gmail.com">cdrootdev@gmail.com</a>.</p>
```

- [ ] **Step 4: Add Korean pages**

Create `site/ko/index.html`, `site/ko/privacy/index.html`, and `site/ko/support/index.html` with the same structure. The Korean home must include:

```html
<a class="button" href="/ko/support/">Chrome Web Store 공개 예정</a>
<p class="lead">첫 출시는 ChatGPT를 지원합니다. Gemini와 Claude는 지원 예정입니다.</p>
```

The Korean privacy page must include:

```html
<p>ChatJumper는 채팅 원문을 저장하지 않습니다.</p>
<p>ChatJumper는 채팅 원문을 외부 서버로 전송하지 않습니다.</p>
<p>ChatJumper는 analytics를 사용하지 않습니다.</p>
<p>ChatJumper는 사용자 설정만 chrome.storage.local에 저장합니다.</p>
```

The Korean support page must include:

```html
<p>공개 버그, selector drift, 기능 요청은 GitHub Issues를 사용하세요.</p>
<p><a href="https://github.com/FASD92/ChatJumper/issues">GitHub Issues 열기</a></p>
<p>개인정보, Chrome Web Store, 비개발자 문의는 <a href="mailto:cdrootdev@gmail.com">cdrootdev@gmail.com</a>로 보내세요.</p>
```

- [ ] **Step 5: Add asset README**

Create `site/assets/README.md`:

```md
# Product Site Assets

Place processed, public-safe Product Site screenshots here.

Expected first-launch screenshot:

- `chatgpt-lorem-screenshot.png`: real ChatGPT UI using lorem ipsum or otherwise non-identifying conversation content.

Do not commit raw screenshots that show private conversations, account information, personal data, or sensitive browser UI.
```

- [ ] **Step 6: Run the Product Site test to verify it passes**

Run:

```bash
npm test -- tests/unit/productSite.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add site tests/unit/productSite.test.ts
git commit -m "feat: add localized product site"
```

---

## Task 3: Public README And Store Submission Pack Tests

**Files:**
- Create: `tests/unit/publicLaunchDocs.test.ts`
- Task 4 creates: `README.md`, `docs/store-submission-pack.md`

- [ ] **Step 1: Write failing public launch docs tests**

Create `tests/unit/publicLaunchDocs.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/publicLaunchDocs.test.ts
```

Expected: FAIL because `README.md` and `docs/store-submission-pack.md` do not exist.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/unit/publicLaunchDocs.test.ts
git commit -m "test: specify public launch docs"
```

---

## Task 4: Public README And Store Submission Pack

**Files:**
- Create: `README.md`
- Create: `docs/store-submission-pack.md`
- Test: `tests/unit/publicLaunchDocs.test.ts`

- [ ] **Step 1: Create public README**

Create `README.md`:

```md
# ChatJumper

ChatJumper is a privacy-first Chrome extension that helps you jump back to your latest question inside long ChatGPT conversations.

## Status

ChatJumper is preparing for its first Chrome Web Store launch.

- First launch site: ChatGPT
- Coming soon: Gemini and Claude are coming soon
- Product Site: GitHub Pages from this repository's `site/` folder

## Features

- Composer Button near the ChatGPT message composer
- Keyboard shortcut: Alt+J on Windows/Linux, Command+J on macOS
- Highlight feedback after jumping
- Popup and Options Page settings stored locally

## Privacy

ChatJumper is local-first.

- It does not store chat content.
- It does not send chat content to any server.
- It does not use analytics.
- It stores user preferences in `chrome.storage.local`.

## Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run TypeScript checks:

```bash
npm run lint
```

Build the extension:

```bash
npm run build
```

The extension build output is written to `dist/`.

## Support

Use GitHub Issues for public bugs, selector drift reports, and feature requests:

https://github.com/FASD92/ChatJumper/issues

For privacy, Chrome Web Store, or non-developer support questions, email:

cdrootdev@gmail.com
```

- [ ] **Step 2: Create Store submission pack**

Create `docs/store-submission-pack.md`:

```md
# ChatJumper Store Submission Pack

This file contains public-safe copy for the first Chrome Web Store submission. Store Console progress and private submission notes belong in ignored local release notes.

## Listing Basics

- Product name: ChatJumper
- Category: Productivity
- Price: Free
- First launch site: ChatGPT
- Coming soon support: Gemini and Claude

## Short Description

Stop losing your place in long ChatGPT chats. Jump back to your latest question instantly.

## Full Description

ChatJumper is a privacy-first Chrome extension for long ChatGPT conversations. Use the floating Composer Button or keyboard shortcut to jump back through your latest user questions, then use highlight feedback to reorient quickly.

ChatJumper is intentionally narrow. It does not summarize chats, export chats, sync conversations, or replace ChatGPT search. It focuses on one job: helping you return to your own questions inside the current conversation.

First launch support is ChatGPT. Gemini and Claude are coming soon.

## Permission Justification

- `storage`: stores user preferences such as Composer Button visibility, highlight feedback, toast feedback, smooth scrolling, and ChatGPT enablement.
- `https://chatgpt.com/*`: allows the content script to find user-question positions in the current ChatGPT page and scroll locally.
- `web_accessible_resources` for `icons/icon-128.png`: allows the content script's Composer Button to display the packaged ChatJumper icon.

## Privacy Summary

- No backend.
- No analytics.
- No chat content storage.
- No chat content server transfer.
- User preferences are stored in `chrome.storage.local`.

## Reviewer Notes

No test account is required because ChatJumper runs in the user's own logged-in ChatGPT session. The extension does not access a developer backend and does not require account linking.

## Screenshot Captions

1. Keep your place in long ChatGPT conversations.
2. Jump back to your latest question and see highlight feedback.
3. Control Composer Button, highlight, toast, and scrolling settings.

## Korean Draft

긴 ChatGPT 대화에서 위치를 잃지 마세요. ChatJumper는 최신 질문으로 즉시 돌아갈 수 있게 도와주는 privacy-first Chrome 확장 프로그램입니다.

첫 출시는 ChatGPT를 지원하며, Gemini와 Claude는 지원 예정입니다.
```

- [ ] **Step 3: Run docs test**

Run:

```bash
npm test -- tests/unit/publicLaunchDocs.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/store-submission-pack.md tests/unit/publicLaunchDocs.test.ts
git commit -m "docs: add public launch materials"
```

---

## Task 5: GitHub Issue Templates

**Files:**
- Create: `tests/unit/issueTemplates.test.ts`
- Create: `.github/ISSUE_TEMPLATE/bug_report.md`
- Create: `.github/ISSUE_TEMPLATE/selector_drift.md`
- Create: `.github/ISSUE_TEMPLATE/feature_request.md`

- [ ] **Step 1: Write failing issue template test**

Create `tests/unit/issueTemplates.test.ts`:

```ts
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
```

- [ ] **Step 2: Run issue template test to verify it fails**

Run:

```bash
npm test -- tests/unit/issueTemplates.test.ts
```

Expected: FAIL because issue templates do not exist.

- [ ] **Step 3: Add issue templates**

Create `.github/ISSUE_TEMPLATE/bug_report.md`:

```md
---
name: Bug report
about: Report a ChatJumper bug
title: "[Bug] "
labels: bug
assignees: ""
---

## Summary

## ChatGPT URL shape

Example: `https://chatgpt.com/c/...`

## Chrome version

## ChatJumper version

## Steps to reproduce

1.
2.
3.

## Expected behavior

## Actual behavior

## Notes

Do not include private chat content, account information, or personal data.
```

Create `.github/ISSUE_TEMPLATE/selector_drift.md`:

```md
---
name: Selector drift
about: Report ChatGPT DOM changed and ChatJumper can no longer find the right question
title: "[Selector drift] "
labels: selector-drift
assignees: ""
---

## Summary

ChatGPT DOM changed and ChatJumper behavior appears incorrect.

## Does the Composer Button appear?

Yes / No

## Does the highlight appear?

Yes / No

## What happens when you press J or the shortcut?

## ChatGPT URL shape

Example: `https://chatgpt.com/c/...`

## Notes

Do not include private chat content, account information, or personal data.
```

Create `.github/ISSUE_TEMPLATE/feature_request.md`:

```md
---
name: Feature request
about: Suggest a focused ChatJumper improvement
title: "[Feature] "
labels: enhancement
assignees: ""
---

## What problem would this solve?

## Proposed behavior

## Does this stay within ChatJumper's single-purpose scope?

ChatJumper's first purpose is jumping back to user questions in long AI chats.

## Notes
```

- [ ] **Step 4: Run issue template test**

Run:

```bash
npm test -- tests/unit/issueTemplates.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .github/ISSUE_TEMPLATE tests/unit/issueTemplates.test.ts
git commit -m "docs: add issue templates"
```

---

## Task 6: Local Release Notes Ignore Rules

**Files:**
- Modify: `.gitignore`
- Create: `tests/unit/localReleaseNotes.test.ts`
- Create but do not commit: `docs/release.local.md`
- Create but do not commit: `docs/store-submission.local.md`

- [ ] **Step 1: Write failing local release notes test**

Create `tests/unit/localReleaseNotes.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/localReleaseNotes.test.ts
```

Expected: FAIL because `.gitignore` lacks the patterns.

- [ ] **Step 3: Update `.gitignore`**

Append:

```gitignore
docs/*.local.md
site/assets/raw/
```

- [ ] **Step 4: Create ignored local working notes**

Create `docs/release.local.md`:

```md
# Local Release Working Note

This file is intentionally ignored by git.

## Checklist

- [ ] Product Site files ready
- [ ] GitHub Pages enabled from `main` branch `/site`
- [ ] Chrome Web Store Developer account ready
- [ ] Extension zip artifact ready
- [ ] Privacy copy publisher-reviewed
- [ ] Screenshot assets processed

## Asset Inventory

- Raw ChatGPT screenshot:
- Processed Product Site screenshot:
- Store screenshot 1:
- Store screenshot 2:
- Store screenshot 3:

## Public URL Status

- GitHub repository:
- Product Site:
- Privacy URL:
- Support URL:
- Chrome Web Store URL:
```

Create `docs/store-submission.local.md`:

```md
# Local Store Submission Working Note

This file is intentionally ignored by git.

## Store Console Status

- Listing text entered:
- Screenshots uploaded:
- Privacy fields completed:
- Package uploaded:
- Submitted:

## Publisher Review

- Privacy policy reviewed:
- Listing reviewed:
- Screenshot content reviewed:
```

- [ ] **Step 5: Verify local files are ignored**

Run:

```bash
git status --short --ignored docs/release.local.md docs/store-submission.local.md site/assets/raw
```

Expected: output marks local note files as ignored with `!!`.

- [ ] **Step 6: Run local release notes test**

Run:

```bash
npm test -- tests/unit/localReleaseNotes.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit only public ignore/test files**

```bash
git add .gitignore tests/unit/localReleaseNotes.test.ts
git commit -m "chore: ignore local release notes"
```

Do not add `docs/release.local.md` or `docs/store-submission.local.md`.

---

## Task 7: Release Package Script

**Files:**
- Create: `scripts/releasePackage.mjs`
- Create: `tests/unit/releasePackage.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing release package unit tests**

Create `tests/unit/releasePackage.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/releasePackage.test.ts
```

Expected: FAIL because `scripts/releasePackage.mjs` does not exist.

- [ ] **Step 3: Implement release package script**

Create `scripts/releasePackage.mjs`:

```js
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = resolve(scriptPath, "../..");

export function createZipName(version) {
  return `chatjumper-v${version}.zip`;
}

export function assertMatchingVersions(packageJson, manifestJson) {
  if (packageJson.version !== manifestJson.version) {
    throw new Error(
      `package.json version ${packageJson.version} must match manifest version ${manifestJson.version}`
    );
  }
}

export function assertDistEntries(entries) {
  const required = [
    "manifest.json",
    "background.js",
    "content.js",
    "popup.html",
    "popup.js",
    "options.html",
    "options.js",
    "icons"
  ];

  for (const entry of required) {
    if (!entries.includes(entry)) {
      throw new Error(`dist is missing required release entry: ${entry}`);
    }
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function buildZip() {
  const packageJson = readJson(join(projectRoot, "package.json"));
  const manifestJson = readJson(join(projectRoot, "public/manifest.json"));
  const distDir = join(projectRoot, "dist");
  const artifactsDir = join(projectRoot, "artifacts");

  assertMatchingVersions(packageJson, manifestJson);

  if (!existsSync(distDir)) {
    throw new Error("dist does not exist. Run npm run build before npm run release:zip.");
  }

  assertDistEntries(readdirSync(distDir));
  mkdirSync(artifactsDir, { recursive: true });

  const zipName = createZipName(packageJson.version);
  const zipPath = join(artifactsDir, zipName);

  if (existsSync(zipPath)) {
    rmSync(zipPath);
  }

  const result = spawnSync("zip", ["-r", zipPath, "."], {
    cwd: distDir,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    throw new Error("Failed to create release zip with the zip command.");
  }

  console.log(`Created ${zipPath}`);
}

if (process.argv[1] === scriptPath) {
  buildZip();
}
```

- [ ] **Step 4: Add npm script**

Modify `package.json` scripts:

```json
"release:zip": "node scripts/releasePackage.mjs"
```

- [ ] **Step 5: Run release package unit test**

Run:

```bash
npm test -- tests/unit/releasePackage.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run build and release zip script**

Run:

```bash
npm run build
npm run release:zip
```

Expected: `artifacts/chatjumper-v0.1.0.zip` is created.

- [ ] **Step 7: Ensure artifacts are ignored**

If `.gitignore` does not already ignore `artifacts/`, add:

```gitignore
artifacts/
```

- [ ] **Step 8: Commit**

```bash
git add package.json scripts/releasePackage.mjs tests/unit/releasePackage.test.ts .gitignore
git commit -m "chore: add release zip packaging"
```

Do not commit generated `artifacts/` files.

---

## Task 8: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `tests/unit/githubActions.test.ts`

- [ ] **Step 1: Write failing workflow test**

Create `tests/unit/githubActions.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/githubActions.test.ts
```

Expected: FAIL because `.github/workflows/ci.yml` does not exist.

- [ ] **Step 3: Add workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Test
        run: npm test

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Create release zip
        run: npm run release:zip

      - name: Upload release zip
        uses: actions/upload-artifact@v4
        with:
          name: chatjumper-release-zip
          path: artifacts/chatjumper-v*.zip
          if-no-files-found: error
```

- [ ] **Step 4: Run workflow test**

Run:

```bash
npm test -- tests/unit/githubActions.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml tests/unit/githubActions.test.ts
git commit -m "ci: add release build workflow"
```

---

## Task 9: Final Release Readiness Verification

**Files:**
- No new files expected.
- May modify files only to fix verification failures found by this task.

- [ ] **Step 1: Run all unit tests**

Run:

```bash
npm test
```

Expected: PASS for all tests.

- [ ] **Step 2: Run TypeScript lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS and `dist/` generated.

- [ ] **Step 4: Run release zip packaging**

Run:

```bash
npm run release:zip
```

Expected: PASS and `artifacts/chatjumper-v0.1.0.zip` generated locally but ignored by git.

- [ ] **Step 5: Confirm local-only files are ignored**

Run:

```bash
git status --short --ignored docs/release.local.md docs/store-submission.local.md artifacts site/assets/raw
```

Expected: ignored files/directories show with `!!`; no generated artifact is staged.

- [ ] **Step 6: Confirm public files do not contain private release note paths**

Run:

```bash
rg "release.local.md|store-submission.local.md|Store Console progress|reviewer response log" README.md site docs/store-submission-pack.md
```

Expected: no matches.

- [ ] **Step 7: Commit verification fixes if any**

If any fixes were required:

```bash
git add <fixed-files>
git commit -m "chore: finalize release readiness"
```

If no fixes were required, do not create an empty commit.
