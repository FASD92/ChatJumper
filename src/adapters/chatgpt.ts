import type { ChatAdapter } from "./base";

const USER_MESSAGE_SELECTOR = '[data-message-author-role="user"]';
const THREAD_ROOT_SELECTORS = ["#thread", "main"];
const EXCLUDED_ANCESTOR_SELECTOR = [
  "form",
  "aside",
  "nav",
  '[role="dialog"]',
  '[role="menu"]',
  '[role="tooltip"]',
  '[popover]',
  "[data-radix-popper-content-wrapper]",
  "[contenteditable='true']",
  "textarea"
].join(",");

export const chatGptAdapter: ChatAdapter = {
  id: "chatgpt",

  canHandle(url: URL): boolean {
    return url.protocol === "https:" && url.hostname === "chatgpt.com";
  },

  findLatestUserMessage(root: Document | HTMLElement): HTMLElement | null {
    const searchRoot = findConversationRoot(root);
    const candidates = Array.from(searchRoot.querySelectorAll<HTMLElement>(
      USER_MESSAGE_SELECTOR
    ));

    return candidates.reverse().find(isUsableMessageCandidate) ?? null;
  },

  getScrollContainer(): Window {
    return window;
  }
};

function isUsableMessageCandidate(element: HTMLElement): boolean {
  return (
    hasVisibleBox(element) &&
    hasVisibleText(element) &&
    !element.closest(EXCLUDED_ANCESTOR_SELECTOR)
  );
}

function hasVisibleBox(element: HTMLElement): boolean {
  if (element.hidden || element.getAttribute("aria-hidden") === "true") {
    return false;
  }

  return element.getClientRects().length > 0;
}

function hasVisibleText(element: HTMLElement): boolean {
  return element.textContent?.trim().length ? true : false;
}

function findConversationRoot(root: Document | HTMLElement): Document | HTMLElement {
  for (const selector of THREAD_ROOT_SELECTORS) {
    const candidate = root.querySelector<HTMLElement>(selector);

    if (candidate) {
      return candidate;
    }
  }

  return root;
}
