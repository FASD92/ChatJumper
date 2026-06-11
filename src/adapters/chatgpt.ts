import type { ChatAdapter } from "./base";

const USER_MESSAGE_SELECTOR = '[data-message-author-role="user"]';
const USER_TURN_SELECTOR = '[data-turn="user"]';
const TURN_CONTAINER_SELECTOR = "[data-turn-id-container]";
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
    const messages = findChatGptUserMessages(root);
    return messages.at(-1) ?? null;
  },

  getScrollContainer(): Window {
    return window;
  }
};

export function findChatGptUserMessages(
  root: Document | HTMLElement
): HTMLElement[] {
  const searchRoot = findConversationRoot(root);
  const turnTargets = findChatGptUserTurnTargets(searchRoot);

  if (turnTargets.length > 0) {
    return turnTargets;
  }

  return findMountedUserMessageTargets(searchRoot);
}

function findChatGptUserTurnTargets(
  root: Document | HTMLElement
): HTMLElement[] {
  const containers = Array.from(
    root.querySelectorAll<HTMLElement>(TURN_CONTAINER_SELECTOR)
  );
  const targets: HTMLElement[] = [];
  const seenTargets = new Set<HTMLElement>();

  for (const container of containers) {
    if (!isTopLevelTurnContainer(container) || !isUsableUserTurn(container)) {
      continue;
    }

    if (seenTargets.has(container)) {
      continue;
    }

    targets.push(container);
    seenTargets.add(container);
  }

  return targets;
}

function findMountedUserMessageTargets(
  root: Document | HTMLElement
): HTMLElement[] {
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>(USER_MESSAGE_SELECTOR)
  );
  const targets: HTMLElement[] = [];
  const seenTargets = new Set<HTMLElement>();

  for (const candidate of candidates) {
    if (!isUsableMessageCandidate(candidate)) {
      continue;
    }

    const target = findMessageScrollTarget(candidate);

    if (!hasVisibleBox(target) || seenTargets.has(target)) {
      continue;
    }

    targets.push(target);
    seenTargets.add(target);
  }

  return targets;
}

function isTopLevelTurnContainer(element: HTMLElement): boolean {
  return !element.parentElement?.closest(TURN_CONTAINER_SELECTOR);
}

function isUsableUserTurn(element: HTMLElement): boolean {
  return (
    hasVisibleBox(element) &&
    hasUserTurnMarker(element) &&
    !element.closest(EXCLUDED_ANCESTOR_SELECTOR)
  );
}

function hasUserTurnMarker(element: HTMLElement): boolean {
  return (
    element.matches(USER_TURN_SELECTOR) ||
    element.querySelector(USER_TURN_SELECTOR) !== null
  );
}

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

function findMessageScrollTarget(message: HTMLElement): HTMLElement {
  return message.closest<HTMLElement>(USER_TURN_SELECTOR) ?? message;
}

function findConversationRoot(
  root: Document | HTMLElement
): Document | HTMLElement {
  for (const selector of THREAD_ROOT_SELECTORS) {
    const candidate = root.querySelector<HTMLElement>(selector);

    if (candidate) {
      return candidate;
    }
  }

  return root;
}
