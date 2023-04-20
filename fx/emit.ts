import type { Channel, Operation } from "../deps.ts";
import type { Action } from "../types.ts";

import { parallel } from "./parallel.ts";

export function* emit({
  channel,
  action,
}: {
  channel: Operation<Channel<Action, void>>;
  action: Action | Action[];
}) {
  const { input } = yield* channel;
  if (Array.isArray(action)) {
    if (action.length === 0) {
      return;
    }
    yield* parallel(action.map((a) => () => input.send(a)));
  } else {
    yield* input.send(action);
  }
}
