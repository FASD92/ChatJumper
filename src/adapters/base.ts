import type { ChatAdapterId } from "../shared/sites";

export interface ChatAdapter {
  readonly id: ChatAdapterId;
  canHandle(url: URL): boolean;
  findLatestUserMessage(root: Document | HTMLElement): HTMLElement | null;
  getScrollContainer(
    root: Document | HTMLElement,
    target: HTMLElement
  ): HTMLElement | Window;
}

export function findAdapterForUrl(
  adapters: readonly ChatAdapter[],
  url: URL
): ChatAdapter | null {
  return adapters.find((adapter) => adapter.canHandle(url)) ?? null;
}

