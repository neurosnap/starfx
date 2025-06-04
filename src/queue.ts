import { createQueue } from "effection";

export function createFilterQueue<T, TClose>(predicate: (v: T) => boolean) {
  const queue = createQueue<T, TClose>();

  return {
    ...queue,
    add(value: T) {
      if (predicate(value)) {
        queue.add(value);
      }
    },
  };
}
