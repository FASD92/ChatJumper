import {
  JUMP_TO_LATEST_USER_MESSAGE,
  type JumpRequestSource,
  type RuntimeRequest,
  type RuntimeResponse
} from "../shared/messages";

chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== "jump-to-latest-user-message" || tab?.id === undefined) {
    return;
  }

  void sendJumpRequest(tab.id, "command");
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.id === undefined) {
    return;
  }

  void sendJumpRequest(tab.id, "action");
});

async function sendJumpRequest(
  tabId: number,
  source: JumpRequestSource
): Promise<void> {
  const request: RuntimeRequest = {
    type: JUMP_TO_LATEST_USER_MESSAGE,
    source
  };

  try {
    await chrome.tabs.sendMessage<RuntimeRequest, RuntimeResponse>(
      tabId,
      request
    );
  } catch (error) {
    console.debug("[ChatJumper] Content script is not available.", error);
  }
}
