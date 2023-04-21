import type { Channel, Operation, Stream } from "./deps.ts";
import type { Action } from "./types.ts";
import { ActionPattern, matcher } from "./matcher.ts";

export function* once({
  channel,
  pattern,
}: {
  channel: Operation<Channel<Action, void>>;
  pattern: ActionPattern;
}) {
  const { output } = yield* channel;
  const msgList = yield* output;
  let next = yield* msgList;
  while (!next.done) {
    const match = matcher(pattern);
    if (match(next.value)) {
      return next.value;
    }
    next = yield* msgList;
  }
}

export function* forEach<T>(
  stream: Stream<T, void>,
  each?: (val: T) => Operation<void>,
) {
  const msgList = yield* stream;
  while (true) {
    const next = yield* msgList;
    if (next.done) {
      return next.value;
    } else if (each) {
      yield* each(next.value);
    }
  }
}

export function* map<T, R>(
  values: T[],
  each: (value: T) => Operation<R>,
): Operation<R[]> {
  const results: R[] = [];
  for (const value of values) {
    results.push(yield* each(value));
  }
  return results;
}
