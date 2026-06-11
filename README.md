# ChatJumper

ChatJumper is a privacy-first Chrome extension that helps you jump back to your latest question inside long ChatGPT conversations.

## Status

ChatJumper is preparing for its first Chrome Web Store launch.

- First launch site: ChatGPT
- Coming soon: Gemini and Claude are coming soon
- Product Site: GitHub Pages from this repository's `site/` folder

## Features

- Composer Button near the ChatGPT message composer
- Keyboard shortcut: Alt+J on Windows/Linux, Command+J on macOS
- Highlight feedback after jumping
- Popup and Options Page settings stored locally

## Privacy

ChatJumper is local-first.

- It does not store chat content.
- It does not send chat content to any server.
- It does not use analytics.
- It stores user preferences in `chrome.storage.local`.

## Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run TypeScript checks:

```bash
npm run lint
```

Build the extension:

```bash
npm run build
```

The extension build output is written to `dist/`.

## Support

Use GitHub Issues for public bugs, selector drift reports, and feature requests:

https://github.com/FASD92/ChatJumper/issues

For privacy, Chrome Web Store, or non-developer support questions, email:

cdrootdev@gmail.com
