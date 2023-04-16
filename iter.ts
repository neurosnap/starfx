import type { Channel, Operation } from "./deps.ts";

export function* cforEach<T>(
  chan: Channel<T, void>,
  each?: (val: T) => Operation<void>,
) {
  const { output } = chan;
  const msgList = yield* output;
  while (true) {
    const next = yield* msgList;
    if (next.done) {
      return next.value;
    } else if (each) {
      yield* each(next.value);
    }
  }
}

export function* forEach<T>(
  chan: Operation<Channel<T, void>>,
  each?: (val: T) => Operation<void>,
) {
  const { output } = yield* chan;
  const msgList = yield* output;
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
