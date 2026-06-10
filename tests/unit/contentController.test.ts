// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatAdapter } from "../../src/adapters/base";
import {
  bootContent,
  handleRuntimeRequest,
  runConfiguredJump
} from "../../src/content/controller";
import { createQuestionNavigator } from "../../src/content/questionNavigator";
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

  it("moves to the latest question first and previous questions on repeated runs", () => {
    const first = createTarget();
    const second = createTarget();
    const latest = createTarget();
    const adapter = createAdapter(latest.element);
    const getUserMessages = vi.fn(() => [
      first.element,
      second.element,
      latest.element
    ]);
    const questionNavigator = {
      next: vi.fn((targets: HTMLElement[]) => ({
        target: targets[questionNavigator.next.mock.calls.length === 1 ? 2 : 1],
        targetCount: targets.length
      }))
    };

    runConfiguredJump({
      adapter,
      root: document,
      settings: DEFAULT_SETTINGS,
      showToast: vi.fn(),
      getUserMessages,
      questionNavigator
    });
    runConfiguredJump({
      adapter,
      root: document,
      settings: DEFAULT_SETTINGS,
      showToast: vi.fn(),
      getUserMessages,
      questionNavigator
    });

    expect(latest.scrollIntoView).toHaveBeenCalledOnce();
    expect(second.scrollIntoView).toHaveBeenCalledOnce();
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

  it("moves to previous questions on repeated command requests", async () => {
    const first = createTarget();
    const previous = createTarget();
    const latest = createTarget();
    const adapter = createAdapter(latest.element);
    const questionNavigator = createQuestionNavigator({
      getViewportHeight: () => 1000
    });
    const request = {
      type: JUMP_TO_LATEST_USER_MESSAGE,
      source: "command" as const
    };
    const commonOptions = {
      request,
      locationHref: "https://chatgpt.com/c/123",
      root: document,
      adapters: [adapter],
      readSettings: async () => DEFAULT_SETTINGS,
      showToast: vi.fn(),
      getUserMessages: () => [first.element, previous.element, latest.element],
      questionNavigator
    };

    setTargetTop(first.element, -1200);
    setTargetTop(previous.element, -200);
    setTargetTop(latest.element, -80);
    await handleRuntimeRequest(commonOptions);
    setTargetTop(latest.element, 500);
    await handleRuntimeRequest(commonOptions);

    expect(latest.scrollIntoView).toHaveBeenCalledOnce();
    expect(previous.scrollIntoView).toHaveBeenCalledOnce();
    expect(first.scrollIntoView).not.toHaveBeenCalled();
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

  it("keeps command navigation moving to previous questions when the bottom signal stays true", async () => {
    const runtime = createRuntime();
    const storage = createStorage(DEFAULT_SETTINGS);
    const first = appendChatGptUserMessage("first question");
    const previous = appendChatGptUserMessage("previous question");
    const latest = appendChatGptUserMessage("latest question");
    const isNearBottom = true;

    setTargetTop(first.element, -1200);
    setTargetTop(previous.element, -200);
    setTargetTop(latest.element, -80);

    await bootContent({
      root: document,
      locationHref: "https://chatgpt.com/c/123",
      storageArea: storage.local,
      runtime: runtime as unknown as typeof chrome.runtime,
      storage: storage as unknown as typeof chrome.storage,
      mutationObserverFactory: FakeMutationObserver,
      scheduleTimeout: vi.fn(),
      getIsNearConversationBottom: () => isNearBottom
    });

    await sendJumpRequest(runtime);

    setTargetTop(latest.element, 500);

    await sendJumpRequest(runtime);

    setTargetTop(previous.element, 500);
    setTargetTop(first.element, 420);

    await sendJumpRequest(runtime);

    expect(latest.scrollIntoView).toHaveBeenCalledOnce();
    expect(previous.scrollIntoView).toHaveBeenCalledOnce();
    expect(first.scrollIntoView).toHaveBeenCalledOnce();
  });

  it("resets command navigation to the current viewport after a user scroll gesture", async () => {
    const runtime = createRuntime();
    const storage = createStorage(DEFAULT_SETTINGS);
    const first = appendChatGptUserMessage("first question");
    const previous = appendChatGptUserMessage("previous question");
    const latest = appendChatGptUserMessage("latest question");

    setTargetTop(first.element, -1200);
    setTargetTop(previous.element, 420);
    setTargetTop(latest.element, -80);

    await bootContent({
      root: document,
      locationHref: "https://chatgpt.com/c/123",
      storageArea: storage.local,
      runtime: runtime as unknown as typeof chrome.runtime,
      storage: storage as unknown as typeof chrome.storage,
      mutationObserverFactory: FakeMutationObserver,
      scheduleTimeout: vi.fn()
    });

    await sendJumpRequest(runtime);

    setTargetTop(latest.element, 500);

    await sendJumpRequest(runtime);

    setTargetTop(latest.element, -80);
    document.dispatchEvent(new WheelEvent("wheel", { deltaY: 200 }));

    await sendJumpRequest(runtime);

    expect(latest.scrollIntoView).toHaveBeenCalledTimes(2);
    expect(previous.scrollIntoView).toHaveBeenCalledOnce();
    expect(first.scrollIntoView).not.toHaveBeenCalled();
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

function setTargetTop(element: HTMLElement, top: number): void {
  const height = 100;

  element.getBoundingClientRect = () =>
    ({
      top,
      height,
      bottom: top + height
    }) as DOMRect;
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

function appendChatGptUserMessage(text: string): {
  element: HTMLElement;
  scrollIntoView: ReturnType<typeof vi.fn>;
} {
  const thread =
    document.querySelector<HTMLElement>("#thread") ??
    document.body.appendChild(Object.assign(document.createElement("main"), {
      id: "thread"
    }));
  const element = document.createElement("article");
  const scrollIntoView = vi.fn();

  element.setAttribute("data-message-author-role", "user");
  element.textContent = text;
  element.scrollIntoView = scrollIntoView;
  element.getClientRects = () => [{ width: 100, height: 100 }] as DOMRectList;
  thread.append(element);

  return {
    element,
    scrollIntoView
  };
}

async function sendJumpRequest(
  runtime: ReturnType<typeof createRuntime>
): Promise<void> {
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
