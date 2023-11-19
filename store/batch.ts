import { action } from "../deps.ts";
import { Next } from "../query/types.ts";
import { UpdaterCtx } from "./types.ts";
import { AnyState } from "../types.ts";

export function createBatchMdw<S extends AnyState>(
  queue: (send: () => void) => void = queueMicrotask,
) {
  let notifying = false;
  return function* batchMdw(_: UpdaterCtx<S>, next: Next) {
    try {
      if (!notifying) {
        notifying = true;
        yield* action<void>(function* (resolve) {
          queue(resolve);
        });
        yield* next();
      }
    } finally {
      notifying = false;
    }
  };
}
