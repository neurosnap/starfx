import { Operation } from "../deps.ts";
import { AnyState } from "../types.ts";
import { updateStore } from "./fx.ts";

export type UpdaterFn<S> = (s: S) => void;
export interface UpdaterFnWithIterator<S> extends UpdaterFn<S> {
  [Symbol.iterator]: Operation<void>;
}

export function createUpdater<S extends AnyState>(
  updater: (s: S) => void,
): UpdaterFnWithIterator<S> {
  (updater as any)[Symbol.iterator] = function* wrapUpdater() {
    yield* updateStore(updater);
  };
  return updater as UpdaterFnWithIterator<S>;
}
