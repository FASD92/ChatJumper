export const CHATJUMPER_COMPOSER_BUTTON_CLASS = "chatjumper-composer-button";
const BUTTON_GAP_PX = 8;
const BUTTON_RIGHT_INSET_PX = 8;
const FALLBACK_BUTTON_SIZE_PX = 42;

const CHATGPT_VOICE_BUTTON_SELECTORS = [
  'button[data-testid="composer-speech-button"]',
  'button[aria-label="Voice mode"]',
  'button[aria-label*="Voice"]',
  'button[aria-label*="voice"]',
  'button[aria-label*="음성"]'
];

export interface SyncComposerButtonOptions {
  root: Document | HTMLElement;
  enabled: boolean;
  onClick: () => void;
}

export function syncComposerButton(
  options: SyncComposerButtonOptions
): HTMLButtonElement | null {
  const existing = findExistingButton(options.root);

  if (!options.enabled) {
    existing?.remove();
    return null;
  }

  const anchor = findVoiceButton(options.root);

  if (!anchor) {
    existing?.remove();
    return null;
  }

  const button = existing ?? createComposerButton(options.root);
  button.onclick = options.onClick;
  const composer = getComposerForm(anchor);

  if (!composer) {
    existing?.remove();
    return null;
  }

  if (button.parentElement !== composer) {
    composer.append(button);
  }

  positionButtonInComposer(button, anchor, composer);
  return button;
}

function createComposerButton(root: Document | HTMLElement): HTMLButtonElement {
  const ownerDocument = getOwnerDocument(root);
  const button = ownerDocument.createElement("button");

  button.type = "button";
  button.className = CHATJUMPER_COMPOSER_BUTTON_CLASS;
  button.textContent = "J";
  button.setAttribute("aria-label", "Jump to latest question");
  button.setAttribute("title", "Jump to latest question");

  return button;
}

function findExistingButton(
  root: Document | HTMLElement
): HTMLButtonElement | null {
  return root.querySelector<HTMLButtonElement>(
    `.${CHATJUMPER_COMPOSER_BUTTON_CLASS}`
  );
}

function findVoiceButton(root: Document | HTMLElement): HTMLButtonElement | null {
  for (const selector of CHATGPT_VOICE_BUTTON_SELECTORS) {
    const candidates = Array.from(
      root.querySelectorAll<HTMLButtonElement>(selector)
    );
    const candidate = candidates.find(isInsideComposer);

    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function isInsideComposer(candidate: HTMLButtonElement): boolean {
  const composer = getComposerForm(candidate);

  if (!composer) {
    return false;
  }

  return Boolean(
    composer.querySelector("textarea, [contenteditable='true']")
  );
}

function positionButtonInComposer(
  button: HTMLButtonElement,
  anchor: HTMLButtonElement,
  composer: HTMLFormElement
): void {
  const anchorRect = anchor.getBoundingClientRect();
  const composerRect = composer.getBoundingClientRect();
  const size = Math.round(anchorRect.height) || FALLBACK_BUTTON_SIZE_PX;
  const desiredLeft = anchorRect.right - composerRect.left + BUTTON_GAP_PX;
  const maxLeft = composerRect.width - size - BUTTON_RIGHT_INSET_PX;
  const left = Math.min(desiredLeft, Math.max(BUTTON_RIGHT_INSET_PX, maxLeft));
  const top = anchorRect.top - composerRect.top;

  if (!composer.style.position) {
    composer.style.position = "relative";
  }

  button.style.position = "absolute";
  button.style.left = `${Math.round(left)}px`;
  button.style.top = `${Math.round(top)}px`;
  button.style.marginLeft = "";
  button.style.width = `${size}px`;
  button.style.height = `${size}px`;
}

function getComposerForm(candidate: HTMLElement): HTMLFormElement | null {
  return candidate.closest("form");
}

function getOwnerDocument(root: Document | HTMLElement): Document {
  return root instanceof Document ? root : root.ownerDocument;
}
