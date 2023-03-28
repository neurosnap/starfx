import type { Channel, Operation } from "../deps.ts";
import type { Action } from "../types.ts";

import { all } from "./all.ts";

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
    yield* all(action.map((a) => () => input.send(a)));
  } else {
    yield* input.send(action);
  }
}
