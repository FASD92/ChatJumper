import type { ChatAdapter } from "../adapters/base";
import type { ChatAdapterId } from "../shared/sites";

export const DEFAULT_HIGHLIGHT_CLASS_NAME = "chatjumper-highlight";
export const DEFAULT_HIGHLIGHT_DURATION_MS = 1200;
const HIGHLIGHT_VISIBILITY_POLL_INTERVAL_MS = 80;
const MAX_HIGHLIGHT_VISIBILITY_WAIT_MS = 2200;

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
    flashTargetWhenVisible(target, options);
  }

  return {
    ok: true,
    status: "JUMPED",
    adapter: adapter.id
  };
}

function flashTargetWhenVisible(
  target: HTMLElement,
  options: JumpEngineOptions,
  elapsedMs = 0
): void {
  if (
    options.smoothScroll === false ||
    isTargetInViewport(target) ||
    elapsedMs >= MAX_HIGHLIGHT_VISIBILITY_WAIT_MS
  ) {
    flashTarget(target, options);
    return;
  }

  const scheduleTimeout = options.scheduleTimeout ?? window.setTimeout;
  scheduleTimeout(
    () =>
      flashTargetWhenVisible(
        target,
        options,
        elapsedMs + HIGHLIGHT_VISIBILITY_POLL_INTERVAL_MS
      ),
    HIGHLIGHT_VISIBILITY_POLL_INTERVAL_MS
  );
}

function isTargetInViewport(target: HTMLElement): boolean {
  const rect = target.getBoundingClientRect();
  const viewportHeight =
    target.ownerDocument?.defaultView?.innerHeight ?? window.innerHeight;

  return rect.bottom > 0 && rect.top < viewportHeight;
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
