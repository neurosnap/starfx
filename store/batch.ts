import { action } from "../deps.ts";
import { UpdaterCtx } from "./types.ts";
import { AnyState, Next } from "../types.ts";

export function createBatchMdw<S extends AnyState>(
  queue: (send: () => void) => void,
) {
  let notifying = false;
  return function* batchMdw(_: UpdaterCtx<S>, next: Next) {
    if (!notifying) {
      notifying = true;
      yield* action<void>((resolve) => () => {
        queue(() => {
          notifying = false;
          resolve();
        });
      });
      yield* next();
    }
  };
}
