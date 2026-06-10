import { findAdapterForUrl, type ChatAdapter } from "../adapters/base";
import { chatGptAdapter } from "../adapters/chatgpt";
import {
  isRuntimeRequest,
  type RuntimeRequest,
  type RuntimeResponse
} from "../shared/messages";
import {
  SETTINGS_STORAGE_KEY,
  createDefaultSettings,
  type ChatJumperSettings
} from "../shared/settings";
import { readSettings, type SettingsStorageArea } from "../shared/settingsStorage";
import { syncComposerButton } from "./composerButton";
import { ensureContentStyles, showToast as defaultShowToast } from "./feedback";
import { jumpToLatestUserMessage } from "./jump";

const DEFAULT_ADAPTERS: readonly ChatAdapter[] = [chatGptAdapter];
const RESYNC_DELAY_MS = 250;
const FALLBACK_ERROR_RESPONSE: RuntimeResponse = {
  ok: false,
  reason: "NOT_FOUND"
};

export interface RunConfiguredJumpOptions {
  adapter: ChatAdapter;
  root: Document | HTMLElement;
  settings: ChatJumperSettings;
  showToast: (message: string) => void;
}

export interface HandleRuntimeRequestOptions {
  request: RuntimeRequest;
  locationHref: string;
  root: Document | HTMLElement;
  adapters?: readonly ChatAdapter[];
  readSettings?: () => Promise<ChatJumperSettings>;
  showToast?: (message: string) => void;
}

export interface BootContentOptions {
  root?: Document;
  locationHref?: string;
  adapters?: readonly ChatAdapter[];
  storageArea?: SettingsStorageArea;
  runtime?: typeof chrome.runtime;
  storage?: typeof chrome.storage;
  mutationObserverFactory?: typeof MutationObserver;
  scheduleTimeout?: (callback: () => void, delayMs: number) => unknown;
}

export function runConfiguredJump(
  options: RunConfiguredJumpOptions
): RuntimeResponse {
  const result = jumpToLatestUserMessage(options.adapter, {
    root: options.root,
    smoothScroll: options.settings.smoothScrollEnabled,
    highlightEnabled: options.settings.highlightEnabled,
    highlightDurationMs: options.settings.highlightDurationMs
  });

  if (!result.ok && options.settings.toastFeedbackEnabled) {
    options.showToast("Could not find your latest question.");
  }

  return result;
}

export async function handleRuntimeRequest(
  options: HandleRuntimeRequestOptions
): Promise<RuntimeResponse> {
  const settings = options.readSettings
    ? await options.readSettings()
    : await readSettings();

  if (!isCurrentSiteEnabled(settings)) {
    return {
      ok: false,
      reason: "UNSUPPORTED_PAGE"
    };
  }

  const adapter = findAdapterForUrl(
    options.adapters ?? DEFAULT_ADAPTERS,
    new URL(options.locationHref)
  );

  if (!adapter) {
    return {
      ok: false,
      reason: "ADAPTER_NOT_FOUND"
    };
  }

  return runConfiguredJump({
    adapter,
    root: options.root,
    settings,
    showToast: options.showToast ?? defaultShowToast
  });
}

export async function bootContent(options: BootContentOptions = {}): Promise<void> {
  const root = options.root ?? document;
  const locationHref = options.locationHref ?? window.location.href;
  const adapters = options.adapters ?? DEFAULT_ADAPTERS;
  const runtime = options.runtime ?? chrome.runtime;
  const storage = options.storage ?? chrome.storage;
  const storageArea = options.storageArea ?? storage.local;
  const scheduleTimeout = options.scheduleTimeout ?? window.setTimeout;
  const mutationObserverFactory =
    options.mutationObserverFactory ?? MutationObserver;
  let settings = await readSettingsSafely(storageArea);
  let resyncPending = false;

  ensureContentStyles(root);
  syncButton();

  runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    if (!isRuntimeRequest(message)) {
      return false;
    }

    void handleRuntimeRequest({
      request: message,
      locationHref,
      root,
      adapters,
      readSettings: async () => settings,
      showToast: defaultShowToast
    })
      .then(sendResponse)
      .catch((error) => {
        console.debug("[ChatJumper] Jump request failed.", error);
        sendResponse({
          ...FALLBACK_ERROR_RESPONSE,
          adapter: findAdapterForUrl(adapters, new URL(locationHref))?.id
        });
      });

    return true;
  });

  storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[SETTINGS_STORAGE_KEY]) {
      return;
    }

    void readSettingsSafely(storageArea).then((nextSettings) => {
      settings = nextSettings;
      syncButton();
    });
  });

  const observer = new mutationObserverFactory(() => {
    if (resyncPending) {
      return;
    }

    resyncPending = true;
    scheduleTimeout(() => {
      resyncPending = false;
      syncButton();
    }, RESYNC_DELAY_MS);
  });
  observer.observe(root.body, {
    childList: true,
    subtree: true
  });

  function syncButton(): void {
    const adapter = findAdapterForUrl(adapters, new URL(locationHref));

    syncComposerButton({
      root,
      enabled:
        Boolean(adapter) &&
        isCurrentSiteEnabled(settings) &&
        settings.composerButtonEnabled,
      onClick: () => {
        if (!adapter) {
          return;
        }

        runConfiguredJump({
          adapter,
          root,
          settings,
          showToast: defaultShowToast
        });
      }
    });
  }
}

function isCurrentSiteEnabled(settings: ChatJumperSettings): boolean {
  return settings.currentSiteEnabled && settings.chatgptEnabled;
}

async function readSettingsSafely(
  storageArea: SettingsStorageArea
): Promise<ChatJumperSettings> {
  try {
    return await readSettings(storageArea);
  } catch (error) {
    console.debug("[ChatJumper] Failed to read settings.", error);
    return createDefaultSettings();
  }
}
