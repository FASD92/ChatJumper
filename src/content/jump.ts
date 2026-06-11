import type { ChatAdapter } from "../adapters/base";
import type { ChatAdapterId } from "../shared/sites";

export const DEFAULT_HIGHLIGHT_CLASS_NAME = "chatjumper-highlight";
export const DEFAULT_HIGHLIGHT_DURATION_MS = 1200;
const CHATGPT_USER_MESSAGE_SELECTOR = '[data-message-author-role="user"]';
const HIGHLIGHT_TARGET_RETRY_INTERVAL_MS = 50;
const MAX_HIGHLIGHT_TARGET_WAIT_MS = 800;

export type JumpEngineResult =
  | {
      ok: true;
      status: "JUMPED";
      adapter: ChatAdapterId;
    }
  | {
      ok: false;
      reason: "NOT_FOUND";
      adapter: ChatAdapterId;
    };

export interface JumpEngineOptions {
  root?: Document | HTMLElement;
  highlightClassName?: string;
  highlightEnabled?: boolean;
  highlightDurationMs?: number;
  smoothScroll?: boolean;
  scheduleTimeout?: (callback: () => void, delayMs: number) => unknown;
}

export function jumpToLatestUserMessage(
  adapter: ChatAdapter,
  options: JumpEngineOptions = {}
): JumpEngineResult {
  const root = options.root ?? document;
  const target = adapter.findLatestUserMessage(root);

  if (!target) {
    return {
      ok: false,
      reason: "NOT_FOUND",
      adapter: adapter.id
    };
  }

  return jumpToUserMessage(adapter, target, options);
}

export function jumpToUserMessage(
  adapter: ChatAdapter,
  target: HTMLElement,
  options: JumpEngineOptions = {}
): JumpEngineResult {
  target.scrollIntoView({
    behavior: options.smoothScroll === false ? "auto" : "smooth",
    block: "center",
    inline: "nearest"
  });

  if (options.highlightEnabled !== false) {
    flashResolvedTarget(target, options);
  }

  return {
    ok: true,
    status: "JUMPED",
    adapter: adapter.id
  };
}

function flashResolvedTarget(
  target: HTMLElement,
  options: JumpEngineOptions,
  elapsedMs = 0
): void {
  const highlightTarget = findHighlightTarget(target);

  if (highlightTarget) {
    flashTarget(highlightTarget, options);
    return;
  }

  if (elapsedMs >= MAX_HIGHLIGHT_TARGET_WAIT_MS) {
    flashTarget(target, options);
    return;
  }

  const scheduleTimeout = options.scheduleTimeout ?? window.setTimeout;
  scheduleTimeout(
    () =>
      flashResolvedTarget(
        target,
        options,
        elapsedMs + HIGHLIGHT_TARGET_RETRY_INTERVAL_MS
      ),
    HIGHLIGHT_TARGET_RETRY_INTERVAL_MS
  );
}

function findHighlightTarget(target: HTMLElement): HTMLElement | null {
  if (!isChatGptTurnWrapper(target)) {
    return target;
  }

  return target.querySelector<HTMLElement>(CHATGPT_USER_MESSAGE_SELECTOR);
}

function isChatGptTurnWrapper(target: HTMLElement): boolean {
  return target.dataset?.turnIdContainer !== undefined;
}

function flashTarget(target: HTMLElement, options: JumpEngineOptions): void {
  const highlightClassName =
    options.highlightClassName ?? DEFAULT_HIGHLIGHT_CLASS_NAME;
  const highlightDurationMs =
    options.highlightDurationMs ?? DEFAULT_HIGHLIGHT_DURATION_MS;
  const scheduleTimeout = options.scheduleTimeout ?? window.setTimeout;

  target.classList.add(highlightClassName);
  scheduleTimeout(
    () => target.classList.remove(highlightClassName),
    highlightDurationMs
  );
}
