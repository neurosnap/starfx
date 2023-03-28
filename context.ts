import { createChannel, createContext, getframe } from "./deps.ts";
import type { Channel } from "./deps.ts";

export const ErrContext = createContext<Channel<Error, void>>(
  "fx:err",
  createChannel<Error, void>(),
);

export function* contextualize(context: string, value: unknown) {
  const frame = yield* getframe();
  frame.context[context] = value;
}
