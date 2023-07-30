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
