# ChatJumper Store Submission Pack

This file contains public-safe copy for the first Chrome Web Store submission. Private submission notes belong in ignored local release notes.

## Listing Basics

- Product name: ChatJumper
- Category: Productivity
- Price: Free
- First launch site: ChatGPT
- Coming soon support: Gemini and Claude

## Short Description

Stop losing your place in long ChatGPT chats. Jump back to your latest question instantly.

## Full Description

ChatJumper is a privacy-first Chrome extension for long ChatGPT conversations. Use the floating Composer Button or keyboard shortcut to jump back through your latest user questions, then use highlight feedback to reorient quickly.

ChatJumper is intentionally narrow. It does not summarize chats, export chats, sync conversations, or replace ChatGPT search. It focuses on one job: helping you return to your own questions inside the current conversation.

First launch support is ChatGPT. Gemini and Claude are coming soon.

## Permission Justification

- `storage`: stores user preferences such as Composer Button visibility, highlight feedback, toast feedback, smooth scrolling, and ChatGPT enablement.
- `https://chatgpt.com/*`: allows the content script to find user-question positions in the current ChatGPT page and scroll locally.
- `web_accessible_resources` for `icons/icon-128.png`: allows the content script's Composer Button to display the packaged ChatJumper icon.

## Privacy Summary

- No backend.
- No analytics.
- No chat content storage.
- No chat content server transfer.
- User preferences are stored in `chrome.storage.local`.

## Reviewer Notes

No test account is required because ChatJumper runs in the user's own logged-in ChatGPT session. The extension does not access a developer backend and does not require account linking.

## Screenshot Captions

1. Keep your place in long ChatGPT conversations.
2. Jump back to your latest question and see highlight feedback.
3. Control Composer Button, highlight, toast, and scrolling settings.

## Korean Draft

긴 ChatGPT 대화에서 위치를 잃지 마세요. ChatJumper는 최신 질문으로 즉시 돌아갈 수 있게 도와주는 privacy-first Chrome 확장 프로그램입니다.

첫 출시는 ChatGPT를 지원하며, Gemini와 Claude는 지원 예정입니다.
