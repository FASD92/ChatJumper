import { findAdapterForUrl, type ChatAdapter } from "../adapters/base";
import {
  isRuntimeRequest,
  type RuntimeRequest,
  type RuntimeResponse
} from "../shared/messages";
import { jumpToLatestUserMessage } from "./jump";

const adapters: readonly ChatAdapter[] = [];

chrome.runtime.onMessage.addListener(
  (
    message: unknown,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: RuntimeResponse) => void
  ) => {
    if (!isRuntimeRequest(message)) {
      return false;
    }

    sendResponse(handleRuntimeRequest(message, window.location, document));
    return false;
  }
);

function handleRuntimeRequest(
  request: RuntimeRequest,
  location: Location,
  root: Document | HTMLElement
): RuntimeResponse {
  const adapter = findAdapterForUrl(adapters, new URL(location.href));

  if (!adapter) {
    return {
      ok: false,
      reason: "ADAPTER_NOT_FOUND"
    };
  }

  console.debug("[ChatJumper] Jump request acknowledged.", request.source);

  return jumpToLatestUserMessage(adapter, { root });
}
