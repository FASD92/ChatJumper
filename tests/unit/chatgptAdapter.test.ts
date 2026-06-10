// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
  chatGptAdapter,
  findChatGptUserMessages
} from "../../src/adapters/chatgpt";

describe("chatGptAdapter", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("handles ChatGPT conversation URLs only", () => {
    expect(chatGptAdapter.canHandle(new URL("https://chatgpt.com/c/123"))).toBe(
      true
    );
    expect(chatGptAdapter.canHandle(new URL("https://example.com/c/123"))).toBe(
      false
    );
  });

  it("returns the latest visible user message", () => {
    const thread = appendThread();
    const first = appendUserMessage(thread, "first question");
    const hidden = appendUserMessage(thread, "hidden question");
    const latest = appendUserMessage(thread, "latest question");

    makeVisible(first);
    makeHidden(hidden);
    makeVisible(latest);

    expect(chatGptAdapter.findLatestUserMessage(document)).toBe(latest);
  });

  it("ignores empty user message candidates", () => {
    const thread = appendThread();
    const empty = appendUserMessage(thread, " ");
    const latest = appendUserMessage(thread, "latest question");

    makeVisible(empty);
    makeVisible(latest);

    expect(chatGptAdapter.findLatestUserMessage(document)).toBe(latest);
  });

  it("ignores visible user-like nodes outside the conversation thread", () => {
    const thread = appendThread();
    const latestInThread = appendUserMessage(thread, "latest thread question");
    const dialog = document.createElement("div");
    const outsideThread = appendUserMessage(dialog, "dialog question");

    dialog.setAttribute("role", "dialog");
    document.body.append(dialog);
    makeVisible(latestInThread);
    makeVisible(outsideThread);

    expect(chatGptAdapter.findLatestUserMessage(document)).toBe(latestInThread);
  });

  it("excludes user-like candidates inside composer controls", () => {
    const thread = appendThread();
    const latestInThread = appendUserMessage(thread, "latest thread question");
    const form = document.createElement("form");
    const composerCandidate = appendUserMessage(form, "composer draft");

    form.append(document.createElement("textarea"));
    thread.append(form);
    makeVisible(latestInThread);
    makeVisible(composerCandidate);

    expect(chatGptAdapter.findLatestUserMessage(document)).toBe(latestInThread);
  });

  it("excludes user-like candidates inside dialogs within the thread root", () => {
    const thread = appendThread();
    const latestInThread = appendUserMessage(thread, "latest thread question");
    const dialog = document.createElement("div");
    const dialogCandidate = appendUserMessage(dialog, "dialog question");

    dialog.setAttribute("role", "dialog");
    thread.append(dialog);
    makeVisible(latestInThread);
    makeVisible(dialogCandidate);

    expect(chatGptAdapter.findLatestUserMessage(document)).toBe(latestInThread);
  });

  it("returns usable user messages in document order", () => {
    const thread = appendThread();
    const first = appendUserMessage(thread, "first question");
    const second = appendUserMessage(thread, "second question");

    makeVisible(first);
    makeVisible(second);

    expect(findChatGptUserMessages(document)).toEqual([first, second]);
  });
});

function appendThread(): HTMLElement {
  const thread = document.createElement("main");
  thread.id = "thread";
  document.body.append(thread);
  return thread;
}

function appendUserMessage(parent: HTMLElement, text: string): HTMLElement {
  const article = document.createElement("article");
  article.dataset.messageAuthorRole = "user";
  article.textContent = text;
  parent.append(article);
  return article;
}

function makeVisible(element: HTMLElement): void {
  element.getClientRects = () =>
    [{ width: 20, height: 20 }] as unknown as DOMRectList;
}

function makeHidden(element: HTMLElement): void {
  element.getClientRects = () => [] as unknown as DOMRectList;
}
