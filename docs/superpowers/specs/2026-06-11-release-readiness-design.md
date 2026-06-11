# ChatJumper Release Readiness Design

## Status

Approved for planning on 2026-06-11.

This design defines the remaining release-readiness work before implementation planning. It does not implement the Product Site, CI, GitHub Pages setup, store submission, or screenshot assets.

## Goal

Prepare ChatJumper for a low-cost first Chrome Web Store launch using:

- a public source repository at `https://github.com/FASD92/ChatJumper`
- a static Product Site published from the same repository through GitHub Pages
- public support surfaces through GitHub Issues and email
- a Chrome Web Store submission package that can be completed by the publisher
- local-only release working notes for submission status and private asset inventory

The first launch remains ChatGPT-only. Gemini and Claude may appear only as Coming Soon Support.

## Responsibility Boundary

Codex can prepare:

- `site/` static Product Site files
- English and Korean Product Site copy
- Privacy and Support pages
- public launch README content
- GitHub Issues templates
- GitHub Actions build, test, lint, and release zip artifact workflow
- release zip naming and version consistency checks
- public-safe Store listing drafts and reviewer notes
- ignored local release working note templates
- automated tests and verification commands

The user must provide or perform:

- making `FASD92/ChatJumper` public
- enabling GitHub Pages from `main` branch `/site`
- Chrome Web Store Developer account registration and payment
- final Chrome Web Store submission
- final publisher review of privacy and listing copy
- real ChatGPT lorem screenshot source images
- any Store Console actions that require account access

## Product Site

The Product Site lives in `site/` and uses static HTML/CSS only. No backend, analytics, external JavaScript framework, or build chain is added for the first launch.

URL structure:

- `/` English home
- `/privacy` English privacy policy
- `/support` English support page
- `/ko` Korean home
- `/ko/privacy` Korean privacy policy
- `/ko/support` Korean support page

The English root pages are the canonical URLs for Chrome Web Store submission. Korean pages are auxiliary user-facing pages.

Home page sections:

- Hero with ChatJumper name, value proposition, and Pre-Store CTA
- screenshot section using a real ChatGPT lorem screenshot supplied by the user
- feature summary for Composer Button, keyboard shortcut, highlight, and Popup settings
- How it works section explaining that ChatJumper reads the current page DOM to find user-question positions and scroll locally
- Privacy-first section covering no chat storage, no server transfer, and no analytics
- Supported site section: ChatGPT supported, Gemini and Claude coming soon
- FAQ covering permissions, stored data, support scope, and issue reporting
- Footer links to Privacy, Support, and GitHub repository

Visual direction:

- Home page uses the release icon's purple/yellow liquid-glass tone for hero and CTA areas
- Privacy and Support pages use a clean minimal document layout
- Language switching uses static links or a simple dropdown that resolves to actual pages
- The site must remain usable without custom JavaScript

Pre-Store CTA:

- Before the Chrome Web Store URL exists, use `Coming soon on Chrome Web Store`
- Do not provide a manual GitHub zip install CTA for general users

## Support Surface

Support channels:

- GitHub Issues for public bug reports, selector drift reports, and feature requests
- `cdrootdev@gmail.com` for privacy, store, and non-developer support inquiries

Issue templates:

- Bug report
- Selector drift
- Feature request

Selector drift is separated because ChatJumper's main operational risk is ChatGPT DOM changes.

## Public Repository README

The README should be suitable for a public launch repository and include:

- short product summary
- supported site: ChatGPT
- Coming Soon Support: Gemini and Claude
- feature list
- privacy-first behavior summary
- local development commands
- support links
- Chrome Web Store status or Pre-Store CTA status

The README should avoid internal release progress, Store Console status, unpublished submission notes, and private asset inventory.

## Store Submission Materials

First actual Store listing language:

- English only

Additional draft material:

- Korean listing draft may be prepared as supporting copy, but it is not part of the first Store Console submission requirement

Store submission pack should include public-safe content:

- short description
- full description
- category recommendation
- permission justification
- privacy summary
- screenshot captions
- reviewer notes explaining no backend, no analytics, and no test account requirement
- Korean draft copy for later localization

Private submission progress is not committed. It belongs in local ignored release notes.

## Local Release Notes

The repository should ignore `docs/*.local.md`.

Local release notes may track:

- submission checklist
- screenshot raw and processed asset inventory
- GitHub Pages URL status
- Chrome Web Store URL status
- zip artifact status
- publisher-review status

Local release notes should not be required to understand or build the project. They are working notes only.

Out of scope for the first implementation plan:

- reviewer response log
- rejection history
- resubmission history

## GitHub Pages

Product Site deployment target:

- same public source repository
- GitHub Pages source: `main` branch, `/site` folder

GitHub Pages deployment is configured by the user in GitHub repository settings. The implementation should prepare the files and instructions, not automate Pages deployment.

## CI And Release Artifact

GitHub Actions should provide:

- `npm test`
- `npm run lint`
- `npm run build`
- release zip artifact generation

Version source:

- `package.json` is the source for zip naming
- `public/manifest.json` version must match `package.json`

Release zip naming:

- `chatjumper-v<version>.zip`

The workflow should upload the zip artifact from CI so the submission package is reproducible outside the local machine.

## Screenshots And Assets

Screenshot strategy:

- use real ChatGPT UI screenshots with lorem ipsum or otherwise non-identifying conversation content
- the user supplies raw screenshots from their logged-in ChatGPT session
- Codex prepares cropping, compression, file placement, alt text, and site insertion
- Store screenshots and Product Site screenshots may share processed assets when appropriate

Do not include real private conversations, account information, sensitive browser UI, or personal data.

## Testing And Verification

Implementation must use test-driven development for production changes.

Expected automated checks:

- Product Site file existence and link integrity tests
- Privacy and Support required-copy tests
- no unreplaced support-email or Store URL placeholders in public files
- package and manifest version consistency test
- release zip artifact contents test
- existing unit tests
- TypeScript lint
- production build

Expected manual smoke checklist:

- ChatGPT Composer Button click
- keyboard shortcut
- highlight feedback
- Popup settings
- reload-then-jump behavior
- image-attached user question behavior
- repeated J navigation behavior
- manual scroll reset behavior

Manual smoke status belongs in a local release note, not public docs.

## Out Of Scope

- implementing Gemini or Claude adapters
- changing extension permissions beyond already-approved release icon web accessibility
- adding analytics, backend, login, license checks, or paid features
- automating Chrome Web Store submission
- automating GitHub Pages deployment
- adding Store Console localization beyond English first submission
- creating a public release checklist document
- tracking reviewer-response history in this implementation slice

## Design Decisions

- Product Site Host: GitHub Pages from `main` branch `/site`
- Public Source Repository: `FASD92/ChatJumper`
- Primary Site Language: English
- Localized Product Site: English root and Korean `/ko`
- Store listing first submission language: English only
- Support email: `cdrootdev@gmail.com`
- Support Channel: GitHub Issues plus email
- Product Site CTA before approval: `Coming soon on Chrome Web Store`
- CI artifact: `chatjumper-v<package.json version>.zip`
- Release checklist: ignored local note only, not public docs
