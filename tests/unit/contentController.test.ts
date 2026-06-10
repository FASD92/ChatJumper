// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatAdapter } from "../../src/adapters/base";
import {
  bootContent,
  handleRuntimeRequest,
  runConfiguredJump
} from "../../src/content/controller";
import { JUMP_TO_LATEST_USER_MESSAGE } from "../../src/shared/messages";
import { DEFAULT_SETTINGS, type ChatJumperSettings } from "../../src/shared/settings";

describe("runConfiguredJump", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("uses settings for smooth scroll, highlight, and toast feedback", () => {
    const target = createTarget();
    const adapter = createAdapter(target.element);
    const showToast = vi.fn();

    const result = runConfiguredJump({
      adapter,
      root: document,
      settings: {
        ...DEFAULT_SETTINGS,
        smoothScrollEnabled: false,
        highlightEnabled: false,
        toastFeedbackEnabled: true
      },
      showToast
    });

    expect(result).toEqual({
      ok: true,
      status: "JUMPED",
      adapter: "chatgpt"
    });
    expect(target.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "center",
      inline: "nearest"
    });
    expect(target.addClass).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
  });

  it("shows a toast when the adapter cannot find a target", () => {
    const adapter = createAdapter(null);
    const showToast = vi.fn();

    const result = runConfiguredJump({
      adapter,
      root: document,
      settings: DEFAULT_SETTINGS,
      showToast
    });

    expect(result).toEqual({
      ok: false,
      reason: "NOT_FOUND",
      adapter: "chatgpt"
    });
    expect(showToast).toHaveBeenCalledWith(
      "Could not find your latest question."
    );
  });
});

describe("handleRuntimeRequest", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("returns unsupported page when the active site setting is off", async () => {
    const response = await handleRuntimeRequest({
      request: {
        type: JUMP_TO_LATEST_USER_MESSAGE,
        source: "command"
      },
      locationHref: "https://chatgpt.com/c/123",
      root: document,
      adapters: [createAdapter(createTarget().element)],
      readSettings: async () => ({
        ...DEFAULT_SETTINGS,
        currentSiteEnabled: false
      }),
      showToast: vi.fn()
    });

    expect(response).toEqual({
      ok: false,
      reason: "UNSUPPORTED_PAGE"
    });
  });

  it("runs the ChatGPT adapter for valid command requests", async () => {
    const target = createTarget();
    const response = await handleRuntimeRequest({
      request: {
        type: JUMP_TO_LATEST_USER_MESSAGE,
        source: "command"
      },
      locationHref: "https://chatgpt.com/c/123",
      root: document,
      adapters: [createAdapter(target.element)],
      readSettings: async () => DEFAULT_SETTINGS,
      showToast: vi.fn()
    });

    expect(response).toEqual({
      ok: true,
      status: "JUMPED",
      adapter: "chatgpt"
    });
  });
});

describe("bootContent", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends an error response when async runtime handling throws", async () => {
    const runtime = createRuntime();
    const storage = createStorage(DEFAULT_SETTINGS);
    const target = createTarget();
    const throwingAdapter: ChatAdapter = {
      ...createAdapter(target.element),
      findLatestUserMessage: vi.fn(() => {
        throw new Error("adapter failed");
      })
    };
    appendComposer();

    await bootContent({
      root: document,
      locationHref: "https://chatgpt.com/c/123",
      adapters: [throwingAdapter],
      storageArea: storage.local,
      runtime: runtime as unknown as typeof chrome.runtime,
      storage: storage as unknown as typeof chrome.storage,
      mutationObserverFactory: FakeMutationObserver,
      scheduleTimeout: vi.fn()
    });

    const sendResponse = vi.fn();
    runtime.listener?.(
      {
        type: JUMP_TO_LATEST_USER_MESSAGE,
        source: "command"
      },
      {},
      sendResponse
    );
    await settleAsync();

    expect(sendResponse).toHaveBeenCalledWith({
      ok: false,
      reason: "NOT_FOUND",
      adapter: "chatgpt"
    });
  });

  it("registers a runtime listener even when initial settings read fails", async () => {
    const runtime = createRuntime();
    const storage = createFailingReadStorage();

    await bootContent({
      root: document,
      locationHref: "https://chatgpt.com/c/123",
      adapters: [createAdapter(createTarget().element)],
      storageArea: storage.local,
      runtime: runtime as unknown as typeof chrome.runtime,
      storage: storage as unknown as typeof chrome.storage,
      mutationObserverFactory: FakeMutationObserver,
      scheduleTimeout: vi.fn()
    });

    expect(runtime.listener).toBeTypeOf("function");
  });
});

function createAdapter(target: HTMLElement | null): ChatAdapter {
  return {
    id: "chatgpt",
    canHandle: vi.fn((url: URL) => url.hostname === "chatgpt.com"),
    findLatestUserMessage: vi.fn(() => target),
    getScrollContainer: vi.fn(() => window)
  };
}

function createTarget(): {
  element: HTMLElement;
  scrollIntoView: ReturnType<typeof vi.fn>;
  addClass: ReturnType<typeof vi.fn>;
} {
  const scrollIntoView = vi.fn();
  const addClass = vi.fn();
  const element = document.createElement("article");

  element.scrollIntoView = scrollIntoView;
  element.classList.add = addClass;

  return {
    element,
    scrollIntoView,
    addClass
  };
}

function appendComposer(): void {
  const form = document.createElement("form");
  const textarea = document.createElement("textarea");
  const voiceButton = document.createElement("button");

  voiceButton.type = "button";
  voiceButton.setAttribute("aria-label", "Voice mode");
  form.append(textarea, voiceButton);
  document.body.append(form);
}

function createRuntime(): {
  listener?: (
    message: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ) => boolean;
  onMessage: {
    addListener: ReturnType<typeof vi.fn>;
  };
} {
  const runtime = {
    listener: undefined as
      | ((
          message: unknown,
          sender: chrome.runtime.MessageSender,
          sendResponse: (response: unknown) => void
        ) => boolean)
      | undefined,
    onMessage: {
      addListener: vi.fn((listener) => {
        runtime.listener = listener;
      })
    }
  };

  return runtime;
}

function createStorage(settings: ChatJumperSettings): {
  local: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
  };
  onChanged: {
    addListener: ReturnType<typeof vi.fn>;
  };
} {
  return {
    local: {
      get: vi.fn(async (key: string) => ({
        [key]: settings
      })),
      set: vi.fn(async () => undefined)
    },
    onChanged: {
      addListener: vi.fn()
    }
  };
}

function createFailingReadStorage(): ReturnType<typeof createStorage> {
  const storage = createStorage(DEFAULT_SETTINGS);
  storage.local.get.mockRejectedValue(new Error("storage unavailable"));
  return storage;
}

class FakeMutationObserver {
  observe = vi.fn();
  disconnect = vi.fn();

  constructor(_callback: MutationCallback) {}
}

async function settleAsync(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
