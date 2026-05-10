import {
  isRuntimeRequest,
  type RuntimeRequest,
  type RuntimeResponse
} from "../shared/messages";

chrome.runtime.onMessage.addListener(
  (
    message: unknown,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: RuntimeResponse) => void
  ) => {
    if (!isRuntimeRequest(message)) {
      return false;
    }

    sendResponse(handleRuntimeRequest(message, window.location));
    return false;
  }
);

function handleRuntimeRequest(
  request: RuntimeRequest,
  location: Location
): RuntimeResponse {
  if (location.hostname !== "chatgpt.com") {
    return {
      ok: false,
      reason: "UNSUPPORTED_PAGE"
    };
  }

  console.debug("[ChatJumper] Jump request acknowledged.", request.source);

  return {
    ok: false,
    reason: "JUMP_ENGINE_NOT_READY"
  };
}

