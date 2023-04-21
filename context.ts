import { getframe } from "./deps.ts";

export function* contextualize(context: string, value: unknown) {
  const frame = yield* getframe();
  frame.context[context] = value;
}
