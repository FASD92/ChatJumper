# Settings Surfaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `chrome.storage.local` settings foundation plus Popup and Options Page surfaces for ChatJumper's first Chrome Web Store release.

**Architecture:** Settings live behind a small shared model and storage adapter so Popup, Options Page, and future content UI use the same keys and defaults. Popup exposes five Quick Settings only; Options Page exposes the same settings plus ChatGPT enablement, highlight duration, shortcut guidance, and privacy/support sections. Static HTML/CSS is copied from `public/`, while Vite builds the TypeScript entrypoints.

**Tech Stack:** TypeScript, Chrome Manifest V3, Vite multi-entry build, Vitest unit tests, `chrome.storage.local`.

---

## Scope

This plan implements only the Settings Surfaces slice:

- `storage.local` settings schema and defaults
- Popup shell and Quick Setting toggles
- Options Page shell and detailed settings
- Build/manifest wiring for Popup and Options Page
- Unit tests for settings normalization, storage behavior, and view models

This plan does not implement Composer Button DOM insertion, ChatGPT adapter selector work, Product Site pages, Playwright extension smoke, or Chrome Web Store assets. Those are separate plans because each can be built and tested independently.

## File Structure

- Create `src/shared/settings.ts`
  - Owns settings type, default values, storage key, normalization, and range limits.
- Create `src/shared/settingsStorage.ts`
  - Owns `chrome.storage.local` read/write/reset wrapper and testable storage interface.
- Create `tests/unit/settings.test.ts`
  - Verifies default settings, normalization, boolean coercion, and highlight duration bounds.
- Create `tests/unit/settingsStorage.test.ts`
  - Verifies read/write/reset with a fake Chrome storage area.
- Modify `vite.config.ts`
  - Adds `popup` and `options` TypeScript entrypoints.
- Modify `public/manifest.json`
  - Adds `action.default_popup` and `options_page`.
- Create `public/popup.html`
  - Static Popup HTML shell loaded by Chrome.
- Create `public/popup.css`
  - Popup layout and toggle styling.
- Create `src/popup/viewModel.ts`
  - Converts `ChatJumperSettings` into Popup row data.
- Create `src/popup/index.ts`
  - Reads settings, renders Popup toggles, writes changes to `storage.local`.
- Create `tests/unit/popupViewModel.test.ts`
  - Verifies Popup exposes exactly the five decided Quick Settings.
- Create `public/options.html`
  - Static Options Page HTML shell loaded by Chrome.
- Create `public/options.css`
  - Options Page layout and control styling.
- Create `src/options/viewModel.ts`
  - Converts `ChatJumperSettings` into Options Page row and duration data.
- Create `src/options/index.ts`
  - Reads settings, renders Options Page controls, writes changes to `storage.local`.
- Create `tests/unit/optionsViewModel.test.ts`
  - Verifies Options Page exposes all decided settings and duration metadata.

## Task 1: Shared Settings Model

**Files:**
- Create: `src/shared/settings.ts`
- Test: `tests/unit/settings.test.ts`

- [ ] **Step 1: Write the failing settings tests**

Create `tests/unit/settings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  DEFAULT_HIGHLIGHT_DURATION_MS,
  DEFAULT_SETTINGS,
  MAX_HIGHLIGHT_DURATION_MS,
  MIN_HIGHLIGHT_DURATION_MS,
  normalizeSettings,
  updateSettings
} from "../../src/shared/settings";

describe("normalizeSettings", () => {
  it("returns privacy-first launch defaults when storage has no value", () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
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

    expect(normalizeSettings({ highlightDurationMs: 1500 }).highlightDurationMs)
      .toBe(1500);
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
```

- [ ] **Step 2: Run the settings tests to verify they fail**

Run:

```bash
npm test -- tests/unit/settings.test.ts
```

Expected: FAIL because `../../src/shared/settings` does not exist.

- [ ] **Step 3: Implement the shared settings model**

Create `src/shared/settings.ts`:

```ts
export const SETTINGS_STORAGE_KEY = "chatJumper.settings.v1";

export const DEFAULT_HIGHLIGHT_DURATION_MS = 1200;
export const MIN_HIGHLIGHT_DURATION_MS = 400;
export const MAX_HIGHLIGHT_DURATION_MS = 3000;

export interface ChatJumperSettings {
  composerButtonEnabled: boolean;
  highlightEnabled: boolean;
  toastFeedbackEnabled: boolean;
  currentSiteEnabled: boolean;
  smoothScrollEnabled: boolean;
  chatgptEnabled: boolean;
  highlightDurationMs: number;
}

export type ChatJumperSettingsPatch = Partial<ChatJumperSettings>;

export const DEFAULT_SETTINGS: ChatJumperSettings = {
  composerButtonEnabled: true,
  highlightEnabled: true,
  toastFeedbackEnabled: true,
  currentSiteEnabled: true,
  smoothScrollEnabled: true,
  chatgptEnabled: true,
  highlightDurationMs: DEFAULT_HIGHLIGHT_DURATION_MS
};

export function normalizeSettings(value: unknown): ChatJumperSettings {
  if (!isRecord(value)) {
    return DEFAULT_SETTINGS;
  }

  return {
    composerButtonEnabled: readBoolean(
      value,
      "composerButtonEnabled",
      DEFAULT_SETTINGS.composerButtonEnabled
    ),
    highlightEnabled: readBoolean(
      value,
      "highlightEnabled",
      DEFAULT_SETTINGS.highlightEnabled
    ),
    toastFeedbackEnabled: readBoolean(
      value,
      "toastFeedbackEnabled",
      DEFAULT_SETTINGS.toastFeedbackEnabled
    ),
    currentSiteEnabled: readBoolean(
      value,
      "currentSiteEnabled",
      DEFAULT_SETTINGS.currentSiteEnabled
    ),
    smoothScrollEnabled: readBoolean(
      value,
      "smoothScrollEnabled",
      DEFAULT_SETTINGS.smoothScrollEnabled
    ),
    chatgptEnabled: readBoolean(
      value,
      "chatgptEnabled",
      DEFAULT_SETTINGS.chatgptEnabled
    ),
    highlightDurationMs: readHighlightDuration(value)
  };
}

export function updateSettings(
  current: ChatJumperSettings,
  patch: ChatJumperSettingsPatch
): ChatJumperSettings {
  return normalizeSettings({
    ...current,
    ...patch
  });
}

function readBoolean(
  value: Record<string, unknown>,
  key: keyof ChatJumperSettings,
  fallback: boolean
): boolean {
  const candidate = value[key];
  return typeof candidate === "boolean" ? candidate : fallback;
}

function readHighlightDuration(value: Record<string, unknown>): number {
  const candidate = value.highlightDurationMs;

  if (
    typeof candidate === "number" &&
    Number.isInteger(candidate) &&
    candidate >= MIN_HIGHLIGHT_DURATION_MS &&
    candidate <= MAX_HIGHLIGHT_DURATION_MS
  ) {
    return candidate;
  }

  return DEFAULT_SETTINGS.highlightDurationMs;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
```

- [ ] **Step 4: Run the settings tests to verify they pass**

Run:

```bash
npm test -- tests/unit/settings.test.ts
```

Expected: PASS with 5 tests passing.

- [ ] **Step 5: Commit the settings model**

Run:

```bash
git add src/shared/settings.ts tests/unit/settings.test.ts
git commit -m "feat: 기본 설정 모델 추가"
```

## Task 2: Shared Settings Storage Wrapper

**Files:**
- Create: `src/shared/settingsStorage.ts`
- Test: `tests/unit/settingsStorage.test.ts`

- [ ] **Step 1: Write the failing storage tests**

Create `tests/unit/settingsStorage.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY
} from "../../src/shared/settings";
import {
  readSettings,
  resetSettings,
  writeSettings,
  type SettingsStorageArea
} from "../../src/shared/settingsStorage";

describe("settingsStorage", () => {
  it("reads normalized defaults when the key is missing", async () => {
    const storage = createFakeStorage({});

    await expect(readSettings(storage)).resolves.toEqual(DEFAULT_SETTINGS);
    expect(storage.get).toHaveBeenCalledWith(SETTINGS_STORAGE_KEY);
  });

  it("reads normalized stored settings", async () => {
    const storage = createFakeStorage({
      [SETTINGS_STORAGE_KEY]: {
        composerButtonEnabled: false,
        highlightDurationMs: 1800
      }
    });

    await expect(readSettings(storage)).resolves.toEqual({
      ...DEFAULT_SETTINGS,
      composerButtonEnabled: false,
      highlightDurationMs: 1800
    });
  });

  it("writes a normalized patch on top of existing settings", async () => {
    const storage = createFakeStorage({
      [SETTINGS_STORAGE_KEY]: {
        composerButtonEnabled: false
      }
    });

    await writeSettings(
      {
        highlightEnabled: false,
        highlightDurationMs: 1600
      },
      storage
    );

    expect(storage.set).toHaveBeenCalledWith({
      [SETTINGS_STORAGE_KEY]: {
        ...DEFAULT_SETTINGS,
        composerButtonEnabled: false,
        highlightEnabled: false,
        highlightDurationMs: 1600
      }
    });
  });

  it("resets settings back to defaults", async () => {
    const storage = createFakeStorage({
      [SETTINGS_STORAGE_KEY]: {
        composerButtonEnabled: false
      }
    });

    await resetSettings(storage);

    expect(storage.set).toHaveBeenCalledWith({
      [SETTINGS_STORAGE_KEY]: DEFAULT_SETTINGS
    });
  });
});

function createFakeStorage(initialData: Record<string, unknown>): SettingsStorageArea {
  const data = { ...initialData };

  return {
    get: vi.fn(async (key: string) => ({
      [key]: data[key]
    })),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(data, items);
    })
  };
}
```

- [ ] **Step 2: Run the storage tests to verify they fail**

Run:

```bash
npm test -- tests/unit/settingsStorage.test.ts
```

Expected: FAIL because `../../src/shared/settingsStorage` does not exist.

- [ ] **Step 3: Implement the storage wrapper**

Create `src/shared/settingsStorage.ts`:

```ts
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  normalizeSettings,
  updateSettings,
  type ChatJumperSettings,
  type ChatJumperSettingsPatch
} from "./settings";

export interface SettingsStorageArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export async function readSettings(
  storageArea: SettingsStorageArea = chrome.storage.local
): Promise<ChatJumperSettings> {
  const result = await storageArea.get(SETTINGS_STORAGE_KEY);
  return normalizeSettings(result[SETTINGS_STORAGE_KEY]);
}

export async function writeSettings(
  patch: ChatJumperSettingsPatch,
  storageArea: SettingsStorageArea = chrome.storage.local
): Promise<ChatJumperSettings> {
  const current = await readSettings(storageArea);
  const next = updateSettings(current, patch);

  await storageArea.set({
    [SETTINGS_STORAGE_KEY]: next
  });

  return next;
}

export async function resetSettings(
  storageArea: SettingsStorageArea = chrome.storage.local
): Promise<ChatJumperSettings> {
  await storageArea.set({
    [SETTINGS_STORAGE_KEY]: DEFAULT_SETTINGS
  });

  return DEFAULT_SETTINGS;
}
```

- [ ] **Step 4: Run storage and settings tests**

Run:

```bash
npm test -- tests/unit/settings.test.ts tests/unit/settingsStorage.test.ts
```

Expected: PASS with both test files passing.

- [ ] **Step 5: Commit the storage wrapper**

Run:

```bash
git add src/shared/settingsStorage.ts tests/unit/settingsStorage.test.ts
git commit -m "feat: 로컬 설정 저장소 추가"
```

## Task 3: Manifest and Static Page Shells

**Files:**
- Modify: `vite.config.ts`
- Modify: `public/manifest.json`
- Create: `public/popup.html`
- Create: `public/popup.css`
- Create: `public/options.html`
- Create: `public/options.css`

- [ ] **Step 1: Add Popup and Options entries to Vite**

Replace `vite.config.ts` with:

```ts
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  publicDir: "public",
  build: {
    emptyOutDir: true,
    outDir: "dist",
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
        options: resolve(__dirname, "src/options/index.ts"),
        popup: resolve(__dirname, "src/popup/index.ts")
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
```

- [ ] **Step 2: Add Popup and Options entries to the manifest**

Replace `public/manifest.json` with:

```json
{
  "manifest_version": 3,
  "name": "ChatJumper",
  "version": "0.1.0",
  "description": "Jump to the latest user question in ChatGPT.",
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "action": {
    "default_title": "ChatJumper settings",
    "default_popup": "popup.html"
  },
  "options_page": "options.html",
  "permissions": ["storage"],
  "content_scripts": [
    {
      "matches": ["https://chatgpt.com/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "commands": {
    "jump-to-latest-user-message": {
      "suggested_key": {
        "default": "Alt+J",
        "mac": "Command+J"
      },
      "description": "Jump to the latest user question"
    }
  }
}
```

- [ ] **Step 3: Create the static Popup shell**

Create `public/popup.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ChatJumper Settings</title>
    <link rel="stylesheet" href="popup.css" />
  </head>
  <body>
    <main id="app" class="cj-popup" data-chatjumper-popup-root></main>
    <script type="module" src="popup.js"></script>
  </body>
</html>
```

Create `public/popup.css`:

```css
:root {
  color-scheme: light dark;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  background: #ffffff;
  color: #1f1a33;
}

body {
  width: 320px;
  margin: 0;
  background: #ffffff;
}

.cj-popup {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.cj-popup__header {
  display: grid;
  gap: 4px;
}

.cj-popup__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.cj-popup__subtitle {
  margin: 0;
  color: #5d5670;
  font-size: 13px;
  line-height: 1.4;
}

.cj-popup__list {
  display: grid;
  gap: 10px;
}

.cj-toggle {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  border: 1px solid #e2dced;
  border-radius: 8px;
  padding: 12px;
  background: #fbf9ff;
}

.cj-toggle__text {
  display: grid;
  gap: 2px;
}

.cj-toggle__label {
  font-size: 14px;
  font-weight: 650;
}

.cj-toggle__description {
  color: #6c647c;
  font-size: 12px;
  line-height: 1.35;
}

.cj-toggle__input {
  width: 42px;
  height: 24px;
  accent-color: #6f3ff5;
}

.cj-popup__status {
  min-height: 18px;
  color: #5d5670;
  font-size: 12px;
}
```

- [ ] **Step 4: Create the static Options shell**

Create `public/options.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ChatJumper Options</title>
    <link rel="stylesheet" href="options.css" />
  </head>
  <body>
    <main id="app" class="cj-options" data-chatjumper-options-root></main>
    <script type="module" src="options.js"></script>
  </body>
</html>
```

Create `public/options.css`:

```css
:root {
  color-scheme: light dark;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  background: #f7f5fb;
  color: #1f1a33;
}

body {
  margin: 0;
  background: #f7f5fb;
}

.cj-options {
  display: grid;
  gap: 18px;
  max-width: 760px;
  margin: 0 auto;
  padding: 32px 20px;
}

.cj-options__header,
.cj-options__section {
  display: grid;
  gap: 10px;
}

.cj-options__title {
  margin: 0;
  font-size: 28px;
  font-weight: 750;
}

.cj-options__subtitle,
.cj-options__copy {
  margin: 0;
  color: #5d5670;
  line-height: 1.5;
}

.cj-options__section {
  border: 1px solid #e2dced;
  border-radius: 8px;
  padding: 18px;
  background: #ffffff;
}

.cj-options__section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.cj-options__list {
  display: grid;
  gap: 10px;
}

.cj-setting {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  border-top: 1px solid #eee8f7;
  padding-top: 12px;
}

.cj-setting:first-child {
  border-top: 0;
  padding-top: 0;
}

.cj-setting__text {
  display: grid;
  gap: 3px;
}

.cj-setting__label {
  font-size: 15px;
  font-weight: 650;
}

.cj-setting__description {
  color: #6c647c;
  font-size: 13px;
  line-height: 1.4;
}

.cj-setting__input {
  width: 42px;
  height: 24px;
  accent-color: #6f3ff5;
}

.cj-duration {
  display: grid;
  gap: 8px;
}

.cj-duration__input {
  width: 120px;
  border: 1px solid #d8d0e7;
  border-radius: 8px;
  padding: 8px 10px;
  font: inherit;
}

.cj-options__links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.cj-options__link {
  color: #4f2fd1;
  font-weight: 650;
}

.cj-options__status {
  min-height: 18px;
  color: #5d5670;
  font-size: 13px;
}
```

- [ ] **Step 5: Run build to verify static shells are copied and entrypoints are missing**

Run:

```bash
npm run build
```

Expected: FAIL because `src/popup/index.ts` and `src/options/index.ts` do not exist.

- [ ] **Step 6: Commit only after Task 4 and Task 5 add the missing entrypoints**

Do not commit in this task. The Vite config points at entrypoints created in Task 4 and Task 5, so this task becomes buildable after those tasks.

## Task 4: Popup Quick Settings UI

**Files:**
- Create: `src/popup/viewModel.ts`
- Create: `src/popup/index.ts`
- Test: `tests/unit/popupViewModel.test.ts`
- Uses static files from Task 3: `public/popup.html`, `public/popup.css`

- [ ] **Step 1: Write the failing Popup view model test**

Create `tests/unit/popupViewModel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../../src/shared/settings";
import {
  getPopupToggleRows,
  POPUP_TOGGLE_KEYS
} from "../../src/popup/viewModel";

describe("getPopupToggleRows", () => {
  it("exposes exactly the five decided Popup quick settings", () => {
    expect(POPUP_TOGGLE_KEYS).toEqual([
      "composerButtonEnabled",
      "highlightEnabled",
      "toastFeedbackEnabled",
      "currentSiteEnabled",
      "smoothScrollEnabled"
    ]);
  });

  it("maps settings into stable Popup row labels and checked states", () => {
    const rows = getPopupToggleRows({
      ...DEFAULT_SETTINGS,
      composerButtonEnabled: false,
      smoothScrollEnabled: false
    });

    expect(rows).toEqual([
      {
        key: "composerButtonEnabled",
        label: "Composer Button",
        description: "Show the J button near the ChatGPT composer.",
        checked: false
      },
      {
        key: "highlightEnabled",
        label: "Highlight after jump",
        description: "Flash the latest question after ChatJumper moves.",
        checked: true
      },
      {
        key: "toastFeedbackEnabled",
        label: "Failure toast",
        description: "Show a short message when no target is found.",
        checked: true
      },
      {
        key: "currentSiteEnabled",
        label: "Enable on this site",
        description: "Allow ChatJumper to run on the current supported site.",
        checked: true
      },
      {
        key: "smoothScrollEnabled",
        label: "Smooth scroll",
        description: "Animate movement to the latest question.",
        checked: false
      }
    ]);
  });
});
```

- [ ] **Step 2: Run the Popup view model test to verify it fails**

Run:

```bash
npm test -- tests/unit/popupViewModel.test.ts
```

Expected: FAIL because `../../src/popup/viewModel` does not exist.

- [ ] **Step 3: Implement the Popup view model**

Create `src/popup/viewModel.ts`:

```ts
import type { ChatJumperSettings } from "../shared/settings";

export type PopupBooleanSettingKey =
  | "composerButtonEnabled"
  | "highlightEnabled"
  | "toastFeedbackEnabled"
  | "currentSiteEnabled"
  | "smoothScrollEnabled";

export interface PopupToggleRow {
  key: PopupBooleanSettingKey;
  label: string;
  description: string;
  checked: boolean;
}

export const POPUP_TOGGLE_KEYS: readonly PopupBooleanSettingKey[] = [
  "composerButtonEnabled",
  "highlightEnabled",
  "toastFeedbackEnabled",
  "currentSiteEnabled",
  "smoothScrollEnabled"
];

const POPUP_TOGGLE_COPY: Record<
  PopupBooleanSettingKey,
  { label: string; description: string }
> = {
  composerButtonEnabled: {
    label: "Composer Button",
    description: "Show the J button near the ChatGPT composer."
  },
  highlightEnabled: {
    label: "Highlight after jump",
    description: "Flash the latest question after ChatJumper moves."
  },
  toastFeedbackEnabled: {
    label: "Failure toast",
    description: "Show a short message when no target is found."
  },
  currentSiteEnabled: {
    label: "Enable on this site",
    description: "Allow ChatJumper to run on the current supported site."
  },
  smoothScrollEnabled: {
    label: "Smooth scroll",
    description: "Animate movement to the latest question."
  }
};

export function getPopupToggleRows(
  settings: ChatJumperSettings
): PopupToggleRow[] {
  return POPUP_TOGGLE_KEYS.map((key) => ({
    key,
    label: POPUP_TOGGLE_COPY[key].label,
    description: POPUP_TOGGLE_COPY[key].description,
    checked: settings[key]
  }));
}
```

- [ ] **Step 4: Implement the Popup renderer**

Create `src/popup/index.ts`:

```ts
import type { ChatJumperSettings } from "../shared/settings";
import {
  readSettings,
  writeSettings,
  type SettingsStorageArea
} from "../shared/settingsStorage";
import {
  getPopupToggleRows,
  type PopupBooleanSettingKey
} from "./viewModel";

const root = document.querySelector<HTMLElement>(
  "[data-chatjumper-popup-root]"
);

if (root) {
  void bootPopup(root);
}

export async function bootPopup(
  rootElement: HTMLElement,
  storageArea: SettingsStorageArea = chrome.storage.local
): Promise<void> {
  const settings = await readSettings(storageArea);
  renderPopup(rootElement, settings, storageArea);
}

function renderPopup(
  rootElement: HTMLElement,
  settings: ChatJumperSettings,
  storageArea: SettingsStorageArea
): void {
  rootElement.replaceChildren();
  rootElement.append(createHeader(), createToggleList(settings, storageArea), createStatus());
}

function createHeader(): HTMLElement {
  const header = document.createElement("section");
  header.className = "cj-popup__header";

  const title = document.createElement("h1");
  title.className = "cj-popup__title";
  title.textContent = "ChatJumper";

  const subtitle = document.createElement("p");
  subtitle.className = "cj-popup__subtitle";
  subtitle.textContent = "Quick settings for jumping back to your latest question.";

  header.append(title, subtitle);
  return header;
}

function createToggleList(
  settings: ChatJumperSettings,
  storageArea: SettingsStorageArea
): HTMLElement {
  const list = document.createElement("section");
  list.className = "cj-popup__list";

  for (const row of getPopupToggleRows(settings)) {
    list.append(createToggleRow(row.key, row.label, row.description, row.checked, storageArea));
  }

  return list;
}

function createToggleRow(
  key: PopupBooleanSettingKey,
  labelText: string,
  descriptionText: string,
  checked: boolean,
  storageArea: SettingsStorageArea
): HTMLElement {
  const label = document.createElement("label");
  label.className = "cj-toggle";

  const text = document.createElement("span");
  text.className = "cj-toggle__text";

  const title = document.createElement("span");
  title.className = "cj-toggle__label";
  title.textContent = labelText;

  const description = document.createElement("span");
  description.className = "cj-toggle__description";
  description.textContent = descriptionText;

  const checkbox = document.createElement("input");
  checkbox.className = "cj-toggle__input";
  checkbox.type = "checkbox";
  checkbox.checked = checked;
  checkbox.addEventListener("change", () => {
    void writeSettings(
      { [key]: checkbox.checked } as Pick<ChatJumperSettings, PopupBooleanSettingKey>,
      storageArea
    );
  });

  text.append(title, description);
  label.append(text, checkbox);
  return label;
}

function createStatus(): HTMLElement {
  const status = document.createElement("p");
  status.className = "cj-popup__status";
  status.textContent = "Composer button status appears here when unavailable.";
  return status;
}
```

- [ ] **Step 5: Run Popup tests**

Run:

```bash
npm test -- tests/unit/popupViewModel.test.ts
```

Expected: PASS with 2 tests passing.

- [ ] **Step 6: Commit after Task 5 completes build wiring**

Do not commit in this task. The build remains incomplete until Options Page entrypoint exists in Task 5.

## Task 5: Options Page Detailed Settings UI

**Files:**
- Create: `src/options/viewModel.ts`
- Create: `src/options/index.ts`
- Test: `tests/unit/optionsViewModel.test.ts`
- Uses static files from Task 3: `public/options.html`, `public/options.css`

- [ ] **Step 1: Write the failing Options view model test**

Create `tests/unit/optionsViewModel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  DEFAULT_HIGHLIGHT_DURATION_MS,
  DEFAULT_SETTINGS,
  MAX_HIGHLIGHT_DURATION_MS,
  MIN_HIGHLIGHT_DURATION_MS
} from "../../src/shared/settings";
import {
  getHighlightDurationControl,
  getOptionsToggleRows,
  OPTIONS_TOGGLE_KEYS
} from "../../src/options/viewModel";

describe("getOptionsToggleRows", () => {
  it("exposes all decided Options Page boolean settings", () => {
    expect(OPTIONS_TOGGLE_KEYS).toEqual([
      "composerButtonEnabled",
      "highlightEnabled",
      "toastFeedbackEnabled",
      "smoothScrollEnabled",
      "chatgptEnabled"
    ]);
  });

  it("maps settings into Options Page labels and checked states", () => {
    const rows = getOptionsToggleRows({
      ...DEFAULT_SETTINGS,
      chatgptEnabled: false
    });

    expect(rows.map((row) => row.label)).toEqual([
      "Composer Button",
      "Highlight after jump",
      "Failure toast",
      "Smooth scroll",
      "ChatGPT support"
    ]);
    expect(rows.find((row) => row.key === "chatgptEnabled")?.checked).toBe(false);
  });
});

describe("getHighlightDurationControl", () => {
  it("returns highlight duration input metadata", () => {
    expect(getHighlightDurationControl(DEFAULT_SETTINGS)).toEqual({
      key: "highlightDurationMs",
      label: "Highlight duration",
      description: "How long the latest question stays highlighted after a jump.",
      value: DEFAULT_HIGHLIGHT_DURATION_MS,
      min: MIN_HIGHLIGHT_DURATION_MS,
      max: MAX_HIGHLIGHT_DURATION_MS,
      step: 100
    });
  });
});
```

- [ ] **Step 2: Run the Options view model test to verify it fails**

Run:

```bash
npm test -- tests/unit/optionsViewModel.test.ts
```

Expected: FAIL because `../../src/options/viewModel` does not exist.

- [ ] **Step 3: Implement the Options view model**

Create `src/options/viewModel.ts`:

```ts
import {
  MAX_HIGHLIGHT_DURATION_MS,
  MIN_HIGHLIGHT_DURATION_MS,
  type ChatJumperSettings
} from "../shared/settings";

export type OptionsBooleanSettingKey =
  | "composerButtonEnabled"
  | "highlightEnabled"
  | "toastFeedbackEnabled"
  | "smoothScrollEnabled"
  | "chatgptEnabled";

export interface OptionsToggleRow {
  key: OptionsBooleanSettingKey;
  label: string;
  description: string;
  checked: boolean;
}

export interface HighlightDurationControl {
  key: "highlightDurationMs";
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
}

export const OPTIONS_TOGGLE_KEYS: readonly OptionsBooleanSettingKey[] = [
  "composerButtonEnabled",
  "highlightEnabled",
  "toastFeedbackEnabled",
  "smoothScrollEnabled",
  "chatgptEnabled"
];

const OPTIONS_TOGGLE_COPY: Record<
  OptionsBooleanSettingKey,
  { label: string; description: string }
> = {
  composerButtonEnabled: {
    label: "Composer Button",
    description: "Show the J button near the ChatGPT composer."
  },
  highlightEnabled: {
    label: "Highlight after jump",
    description: "Flash the latest question after ChatJumper moves."
  },
  toastFeedbackEnabled: {
    label: "Failure toast",
    description: "Show a short message when no target is found."
  },
  smoothScrollEnabled: {
    label: "Smooth scroll",
    description: "Animate movement to the latest question."
  },
  chatgptEnabled: {
    label: "ChatGPT support",
    description: "Allow ChatJumper to run on chatgpt.com."
  }
};

export function getOptionsToggleRows(
  settings: ChatJumperSettings
): OptionsToggleRow[] {
  return OPTIONS_TOGGLE_KEYS.map((key) => ({
    key,
    label: OPTIONS_TOGGLE_COPY[key].label,
    description: OPTIONS_TOGGLE_COPY[key].description,
    checked: settings[key]
  }));
}

export function getHighlightDurationControl(
  settings: ChatJumperSettings
): HighlightDurationControl {
  return {
    key: "highlightDurationMs",
    label: "Highlight duration",
    description: "How long the latest question stays highlighted after a jump.",
    value: settings.highlightDurationMs,
    min: MIN_HIGHLIGHT_DURATION_MS,
    max: MAX_HIGHLIGHT_DURATION_MS,
    step: 100
  };
}
```

- [ ] **Step 4: Implement the Options Page renderer**

Create `src/options/index.ts`:

```ts
import type { ChatJumperSettings } from "../shared/settings";
import {
  readSettings,
  writeSettings,
  type SettingsStorageArea
} from "../shared/settingsStorage";
import {
  getHighlightDurationControl,
  getOptionsToggleRows,
  type OptionsBooleanSettingKey
} from "./viewModel";

const root = document.querySelector<HTMLElement>(
  "[data-chatjumper-options-root]"
);

if (root) {
  void bootOptions(root);
}

export async function bootOptions(
  rootElement: HTMLElement,
  storageArea: SettingsStorageArea = chrome.storage.local
): Promise<void> {
  const settings = await readSettings(storageArea);
  renderOptions(rootElement, settings, storageArea);
}

function renderOptions(
  rootElement: HTMLElement,
  settings: ChatJumperSettings,
  storageArea: SettingsStorageArea
): void {
  rootElement.replaceChildren();
  rootElement.append(
    createHeader(),
    createSettingsSection(settings, storageArea),
    createGuidanceSection(),
    createPrivacySection(),
    createSupportSection(),
    createStatus()
  );
}

function createHeader(): HTMLElement {
  const header = document.createElement("header");
  header.className = "cj-options__header";

  const title = document.createElement("h1");
  title.className = "cj-options__title";
  title.textContent = "ChatJumper Options";

  const subtitle = document.createElement("p");
  subtitle.className = "cj-options__subtitle";
  subtitle.textContent =
    "Detailed settings for jumping back to your latest ChatGPT question.";

  header.append(title, subtitle);
  return header;
}

function createSettingsSection(
  settings: ChatJumperSettings,
  storageArea: SettingsStorageArea
): HTMLElement {
  const section = createSection("Settings");
  const list = document.createElement("div");
  list.className = "cj-options__list";

  for (const row of getOptionsToggleRows(settings)) {
    list.append(createToggleRow(row.key, row.label, row.description, row.checked, storageArea));
  }

  list.append(createDurationControl(settings, storageArea));
  section.append(list);
  return section;
}

function createToggleRow(
  key: OptionsBooleanSettingKey,
  labelText: string,
  descriptionText: string,
  checked: boolean,
  storageArea: SettingsStorageArea
): HTMLElement {
  const label = document.createElement("label");
  label.className = "cj-setting";

  const text = document.createElement("span");
  text.className = "cj-setting__text";

  const title = document.createElement("span");
  title.className = "cj-setting__label";
  title.textContent = labelText;

  const description = document.createElement("span");
  description.className = "cj-setting__description";
  description.textContent = descriptionText;

  const checkbox = document.createElement("input");
  checkbox.className = "cj-setting__input";
  checkbox.type = "checkbox";
  checkbox.checked = checked;
  checkbox.addEventListener("change", () => {
    void writeSettings(
      { [key]: checkbox.checked } as Pick<ChatJumperSettings, OptionsBooleanSettingKey>,
      storageArea
    );
  });

  text.append(title, description);
  label.append(text, checkbox);
  return label;
}

function createDurationControl(
  settings: ChatJumperSettings,
  storageArea: SettingsStorageArea
): HTMLElement {
  const control = getHighlightDurationControl(settings);
  const wrapper = document.createElement("label");
  wrapper.className = "cj-setting cj-duration";

  const text = document.createElement("span");
  text.className = "cj-setting__text";

  const title = document.createElement("span");
  title.className = "cj-setting__label";
  title.textContent = control.label;

  const description = document.createElement("span");
  description.className = "cj-setting__description";
  description.textContent = control.description;

  const input = document.createElement("input");
  input.className = "cj-duration__input";
  input.type = "number";
  input.min = String(control.min);
  input.max = String(control.max);
  input.step = String(control.step);
  input.value = String(control.value);
  input.addEventListener("change", () => {
    void writeSettings(
      { highlightDurationMs: Number(input.value) },
      storageArea
    );
  });

  text.append(title, description);
  wrapper.append(text, input);
  return wrapper;
}

function createGuidanceSection(): HTMLElement {
  const section = createSection("Shortcut");
  const copy = document.createElement("p");
  copy.className = "cj-options__copy";
  copy.textContent =
    "Use Alt+J on Windows/Linux or Command+J on macOS. You can remap the shortcut from chrome://extensions/shortcuts.";
  section.append(copy);
  return section;
}

function createPrivacySection(): HTMLElement {
  const section = createSection("Privacy");
  section.id = "privacy";
  const copy = document.createElement("p");
  copy.className = "cj-options__copy";
  copy.textContent =
    "ChatJumper stores settings in this Chrome profile only. It does not store chat text, send conversation content to a server, or include analytics.";
  section.append(copy);
  return section;
}

function createSupportSection(): HTMLElement {
  const section = createSection("Support");
  section.id = "support";
  const copy = document.createElement("p");
  copy.className = "cj-options__copy";
  copy.textContent =
    "Use the Product Site support page for bug reports, privacy questions, and Chrome Web Store support requests.";
  section.append(copy);
  return section;
}

function createStatus(): HTMLElement {
  const status = document.createElement("p");
  status.className = "cj-options__status";
  status.textContent = "Composer button status appears here when unavailable.";
  return status;
}

function createSection(titleText: string): HTMLElement {
  const section = document.createElement("section");
  section.className = "cj-options__section";

  const title = document.createElement("h2");
  title.className = "cj-options__section-title";
  title.textContent = titleText;

  section.append(title);
  return section;
}
```

- [ ] **Step 5: Run Options tests**

Run:

```bash
npm test -- tests/unit/optionsViewModel.test.ts
```

Expected: PASS with 3 tests passing.

- [ ] **Step 6: Run full verification now that Popup and Options entrypoints exist**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected:

- `npm test`: PASS for existing and new unit tests
- `npm run lint`: PASS
- `npm run build`: PASS and `dist/` contains `popup.html`, `popup.js`, `options.html`, `options.js`, and `manifest.json`

- [ ] **Step 7: Commit manifest, static shells, Popup, and Options**

Run:

```bash
git add vite.config.ts public/manifest.json public/popup.html public/popup.css public/options.html public/options.css src/popup/viewModel.ts src/popup/index.ts src/options/viewModel.ts src/options/index.ts tests/unit/popupViewModel.test.ts tests/unit/optionsViewModel.test.ts
git commit -m "feat: 팝업과 옵션 설정 화면 추가"
```

## Task 6: Final Settings Surface Verification

**Files:**
- No file changes expected

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected:

- `npm test`: all unit tests pass
- `npm run lint`: TypeScript passes with no errors
- `npm run build`: Vite builds extension bundles
- `git diff --check`: no whitespace errors

- [ ] **Step 2: Inspect the built manifest**

Run:

```bash
sed -n '1,220p' dist/manifest.json
```

Expected: manifest contains:

```json
"default_popup": "popup.html"
```

and:

```json
"options_page": "options.html"
```

Expected: manifest still contains only:

```json
"matches": ["https://chatgpt.com/*"]
```

- [ ] **Step 3: Verify no forbidden scope creep entered the slice**

Run:

```bash
rg --pcre2 -n "storage\\.sync|analytics|license|payment|gemini\\.google\\.com|claude\\.ai|host_permissions|scripting|activeTab|tabs" public src tests package.json vite.config.ts
```

Expected: no matches, except `"analytics"` in user-facing privacy copy if it exists in `src/options/index.ts`.

- [ ] **Step 4: Verify git status**

Run:

```bash
git status --short
```

Expected: clean worktree, except ignored `dist/` and `node_modules/`.

## Self-Review

### Spec coverage

- `chrome.storage.local` only: Task 1 and Task 2.
- Popup with five Quick Settings: Task 4.
- Options Page with detailed settings, shortcut guidance, privacy/support copy: Task 5.
- Popup and Options share the same storage keys: Task 1 defines one model; Task 2 defines one storage adapter; Task 4 and Task 5 both write through that adapter.
- Manifest and build wiring: Task 3 and Task 5.
- No backend, analytics, sync, payment, broader host permissions: Task 6 checks forbidden scope creep.

### Known gaps outside this plan

- Composer Button DOM insertion is not implemented here.
- ChatGPT adapter selector work is not implemented here.
- Product Site pages are not implemented here.
- Playwright extension smoke is not implemented here.
- Chrome Web Store screenshots and listing assets are not implemented here.

### Type consistency

- `ChatJumperSettings` is the single source of truth for setting keys.
- Popup writes `PopupBooleanSettingKey` keys only.
- Options writes `OptionsBooleanSettingKey` keys and `highlightDurationMs`.
- `SettingsStorageArea` is shared by Popup, Options, and tests.
