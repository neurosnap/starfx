import { createChannel, createContext } from "./deps.ts";
import type { ActionWithPayload } from "./types.ts";

export interface LogMessage {
  [key: string]: any;
}
export type LogAction = ActionWithPayload<LogMessage>;

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
