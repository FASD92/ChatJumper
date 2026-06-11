export const CHATJUMPER_STYLE_MARKER = "data-chatjumper-styles";
export const CHATJUMPER_TOAST_CLASS = "chatjumper-toast";

let toastRenderVersion = 0;

export interface ToastOptions {
  root?: Document | HTMLElement;
  durationMs?: number;
  scheduleTimeout?: (callback: () => void, delayMs: number) => unknown;
}

export function ensureContentStyles(root: Document = document): void {
  if (root.head.querySelector(`style[${CHATJUMPER_STYLE_MARKER}]`)) {
    return;
  }

  const style = root.createElement("style");
  style.setAttribute(CHATJUMPER_STYLE_MARKER, "true");
  style.textContent = `
.chatjumper-composer-button {
  align-items: center;
  appearance: none;
  background-color: transparent;
  background-image: var(--chatjumper-composer-icon-url);
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  border: 0;
  box-sizing: border-box;
  color: transparent;
  cursor: pointer;
  display: inline-flex;
  font: 0/0 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  justify-content: center;
  overflow: visible;
  padding: 0;
  z-index: 2147483647;
}

.chatjumper-composer-button:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.chatjumper-highlight {
  border-radius: 8px;
  box-shadow: 0 0 0 3px rgba(253, 224, 71, 0.86), 0 0 0 7px rgba(109, 40, 217, 0.22);
  transition: box-shadow 160ms ease-out;
}

.chatjumper-toast {
  background: rgba(24, 24, 27, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  bottom: 96px;
  color: #fff;
  font: 500 13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  left: 50%;
  max-width: min(360px, calc(100vw - 32px));
  padding: 10px 12px;
  position: fixed;
  transform: translateX(-50%);
  z-index: 2147483647;
}
`;
  root.head.append(style);
}

export function showToast(message: string, options: ToastOptions = {}): void {
  const root = options.root ?? document;
  const ownerDocument = root.ownerDocument ?? document;
  const body = ownerDocument.body;
  const scheduleTimeout = options.scheduleTimeout ?? window.setTimeout;
  const durationMs = options.durationMs ?? 1800;
  const existing = body.querySelector<HTMLElement>(`.${CHATJUMPER_TOAST_CLASS}`);
  const toast = existing ?? ownerDocument.createElement("div");
  const currentVersion = ++toastRenderVersion;

  toast.className = CHATJUMPER_TOAST_CLASS;
  toast.textContent = message;

  if (!existing) {
    body.append(toast);
  }

  scheduleTimeout(() => {
    if (currentVersion === toastRenderVersion) {
      toast.remove();
    }
  }, durationMs);
}
