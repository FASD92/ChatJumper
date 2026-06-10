import { describe, expect, it, vi } from "vitest";
import {
  findAdapterForUrl,
  type ChatAdapter
} from "../../src/adapters/base";
import {
  DEFAULT_HIGHLIGHT_CLASS_NAME,
  jumpToLatestUserMessage
} from "../../src/content/jump";

describe("findAdapterForUrl", () => {
  it("returns the first adapter that can handle the current URL", () => {
    const unsupportedAdapter = createAdapter({
      canHandle: () => false,
      target: null
    });
    const chatGptAdapter = createAdapter({
      canHandle: (url) => url.hostname === "chatgpt.com",
      target: null
    });

    const result = findAdapterForUrl(
      [unsupportedAdapter, chatGptAdapter],
      new URL("https://chatgpt.com/c/123")
    );

    expect(result).toBe(chatGptAdapter);
  });

  it("returns null when no adapter can handle the current URL", () => {
    const adapter = createAdapter({
      canHandle: () => false,
      target: null
    });

    expect(
      findAdapterForUrl([adapter], new URL("https://example.com"))
    ).toBeNull();
  });
});

describe("jumpToLatestUserMessage", () => {
  it("returns NOT_FOUND without scrolling when the adapter has no target", () => {
    const adapter = createAdapter({
      canHandle: () => true,
      target: null
    });

    const result = jumpToLatestUserMessage(adapter, {
      root: createRoot()
    });

    expect(result).toEqual({
      ok: false,
      reason: "NOT_FOUND",
      adapter: "chatgpt"
    });
    expect(adapter.findLatestUserMessage).toHaveBeenCalledOnce();
  });

  it("scrolls to the target and removes highlight after the flash delay", () => {
    const target = createTarget();
    const adapter = createAdapter({
      canHandle: () => true,
      target: target.element
    });
    const scheduledCallbacks: Array<() => void> = [];
    const scheduleTimeout = vi.fn((callback: () => void, _delayMs: number) => {
      scheduledCallbacks.push(callback);
    });

    const result = jumpToLatestUserMessage(adapter, {
      root: createRoot(),
      scheduleTimeout
    });

    expect(result).toEqual({
      ok: true,
      status: "JUMPED",
      adapter: "chatgpt"
    });
    expect(target.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
      inline: "nearest"
    });
    expect(target.addClass).toHaveBeenCalledWith(
      DEFAULT_HIGHLIGHT_CLASS_NAME
    );
    expect(scheduleTimeout).toHaveBeenCalledWith(expect.any(Function), 1200);

    scheduledCallbacks[0]();

    expect(target.removeClass).toHaveBeenCalledWith(DEFAULT_HIGHLIGHT_CLASS_NAME);
  });
});

function createAdapter(options: {
  canHandle: (url: URL) => boolean;
  target: HTMLElement | null;
}): ChatAdapter {
  return {
    id: "chatgpt",
    canHandle: vi.fn(options.canHandle),
    findLatestUserMessage: vi.fn(() => options.target),
    getScrollContainer: vi.fn(() => createRoot() as HTMLElement)
  };
}

function createRoot(): Document {
  return {} as Document;
}

function createTarget(): {
  element: HTMLElement;
  scrollIntoView: ReturnType<typeof vi.fn>;
  addClass: ReturnType<typeof vi.fn>;
  removeClass: ReturnType<typeof vi.fn>;
} {
  const scrollIntoView = vi.fn();
  const addClass = vi.fn();
  const removeClass = vi.fn();
  const element = {
    scrollIntoView,
    classList: {
      add: addClass,
      remove: removeClass
    }
  } as unknown as HTMLElement;

  return {
    element,
    scrollIntoView,
    addClass,
    removeClass
  };
}
