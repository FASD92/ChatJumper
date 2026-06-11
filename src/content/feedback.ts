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
  background:
    radial-gradient(circle at 24% 22%, rgba(169, 224, 255, 0.92) 0, rgba(169, 224, 255, 0.36) 22%, transparent 42%),
    radial-gradient(circle at 82% 78%, rgba(240, 61, 255, 0.72) 0, rgba(240, 61, 255, 0.28) 28%, transparent 54%),
    linear-gradient(145deg, #9a65ff 0%, #6d28d9 42%, #3f168f 100%);
  border: 2px solid #f8c43a;
  border-radius: 16px;
  box-sizing: border-box;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.72),
    inset 0 -3px 8px rgba(48, 18, 115, 0.58),
    0 0 0 1px rgba(255, 242, 164, 0.38),
    0 8px 18px rgba(26, 14, 44, 0.38),
    0 0 18px rgba(248, 196, 58, 0.36);
  color: #ffe34f;
  cursor: pointer;
  display: inline-flex;
  font: 800 25px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  justify-content: center;
  overflow: hidden;
  padding: 0;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.58),
    0 2px 5px rgba(109, 40, 217, 0.48),
    0 0 9px rgba(255, 226, 79, 0.72);
  z-index: 2147483647;
}

.chatjumper-composer-button::before {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.48), transparent 62%);
  border-radius: 14px;
  content: "";
  inset: 3px;
  pointer-events: none;
  position: absolute;
}

.chatjumper-composer-button::after {
  background: linear-gradient(180deg, #fff27a 0%, #f7b900 100%);
  bottom: 11px;
  box-shadow: 0 0 7px rgba(255, 226, 79, 0.74);
  clip-path: polygon(50% 0, 100% 46%, 72% 46%, 72% 100%, 28% 100%, 28% 46%, 0 46%);
  content: "";
  height: 16px;
  left: 10px;
  opacity: 0.98;
  pointer-events: none;
  position: absolute;
  width: 16px;
}

.chatjumper-composer-button:hover {
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.78),
    inset 0 -3px 8px rgba(48, 18, 115, 0.52),
    0 0 0 1px rgba(255, 242, 164, 0.5),
    0 10px 20px rgba(26, 14, 44, 0.44),
    0 0 22px rgba(248, 196, 58, 0.52);
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
