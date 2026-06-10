import type { ChatAdapter } from "../adapters/base";
import type { ChatAdapterId } from "../shared/sites";

export const DEFAULT_HIGHLIGHT_CLASS_NAME = "chatjumper-highlight";
export const DEFAULT_HIGHLIGHT_DURATION_MS = 1200;

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
  highlightDurationMs?: number;
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

  target.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest"
  });

  flashTarget(target, options);

  return {
    ok: true,
    status: "JUMPED",
    adapter: adapter.id
  };
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
