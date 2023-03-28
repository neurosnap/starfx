import { getframe } from "../deps.ts";

export function* cancelled() {
  const frame = yield* getframe();
  return frame.context["cancelled"] || false;
}
