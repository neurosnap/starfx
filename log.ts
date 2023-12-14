import { createChannel, createContext } from "./deps.ts";
import type { ActionWPayload } from "./types.ts";

export interface LogMessage {
  [key: string]: any;
}
export type LogAction = ActionWPayload<LogMessage>;

export function createLogger(type: string) {
  return function (payload: LogMessage) {
    return log({ type, payload });
  };
}

export function* log(action: LogAction) {
  const chan = yield* LogContext;
  yield* chan.send(action);
}

export const LogContext = createContext(
  "starfx:logger",
  createChannel<LogAction>(),
);
