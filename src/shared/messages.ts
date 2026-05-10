export const JUMP_TO_LATEST_USER_MESSAGE =
  "chatjumper.jumpToLatestUserMessage" as const;

export type JumpRequestSource = "action" | "command";

export interface JumpToLatestUserMessageRequest {
  type: typeof JUMP_TO_LATEST_USER_MESSAGE;
  source: JumpRequestSource;
}

export type JumpToLatestUserMessageResponse =
  | {
      ok: true;
      status: "ACKNOWLEDGED";
    }
  | {
      ok: false;
      reason: "UNSUPPORTED_PAGE" | "JUMP_ENGINE_NOT_READY";
    };

export type RuntimeRequest = JumpToLatestUserMessageRequest;
export type RuntimeResponse = JumpToLatestUserMessageResponse;

export function isRuntimeRequest(message: unknown): message is RuntimeRequest {
  if (!isRecord(message)) {
    return false;
  }

  return (
    message.type === JUMP_TO_LATEST_USER_MESSAGE &&
    (message.source === "action" || message.source === "command")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

