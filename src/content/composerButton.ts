export const CHATJUMPER_COMPOSER_BUTTON_CLASS = "chatjumper-composer-button";
const CHATJUMPER_COMPOSER_ICON_PATH = "icons/icon-128.png";
const CHATJUMPER_COMPOSER_ICON_STYLE_VAR =
  "--chatjumper-composer-icon-url";

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

  const button = existing ?? createComposerButton(options.root);
  button.onclick = options.onClick;
  syncComposerButtonIcon(button);
  const ownerDocument = getOwnerDocument(options.root);

  if (button.parentElement !== ownerDocument.body) {
    ownerDocument.body.append(button);
  }

  positionFloatingButton(button);
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

function positionFloatingButton(button: HTMLButtonElement): void {
  button.style.position = "fixed";
  button.style.right = "24px";
  button.style.bottom = "112px";
  button.style.left = "";
  button.style.top = "";
  button.style.marginLeft = "";
  button.style.width = "52px";
  button.style.height = "52px";
}

function syncComposerButtonIcon(button: HTMLButtonElement): void {
  const iconUrl = getComposerIconUrl();

  if (!iconUrl) {
    button.style.removeProperty(CHATJUMPER_COMPOSER_ICON_STYLE_VAR);
    return;
  }

  button.style.setProperty(
    CHATJUMPER_COMPOSER_ICON_STYLE_VAR,
    `url("${iconUrl}")`
  );
}

function getComposerIconUrl(): string | null {
  if (typeof chrome === "undefined" || !chrome.runtime?.getURL) {
    return null;
  }

  return chrome.runtime.getURL(CHATJUMPER_COMPOSER_ICON_PATH);
}

function getOwnerDocument(root: Document | HTMLElement): Document {
  return root instanceof Document ? root : root.ownerDocument;
}
