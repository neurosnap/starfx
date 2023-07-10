import type { Operation, Stream } from "./deps.ts";

export function* forEach<T>(
  stream: Stream<T, void>,
  each?: (val: T) => Operation<void>,
) {
  const msgList = yield* stream;
  while (true) {
    const next = yield* msgList.next();
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
