import { Err, Ok, Operation, Result } from "../deps.ts";
import { Next } from "../query/types.ts";
import { AnyState } from "../types.ts";
import { select, updateStore } from "./fx.ts";
import { UpdaterCtx } from "./types.ts";

export const PERSIST_LOADER_ID = "persist";

export interface PersistAdapter<S extends AnyState> {
  getItem(key: string): Operation<Result<Partial<S>>>;
  setItem(key: string, item: Partial<S>): Operation<Result<unknown>>;
  removeItem(key: string): Operation<Result<unknown>>;
}

export interface PersistProps<S extends AnyState> {
  adapter: PersistAdapter<S>;
  allowlist: (keyof S)[];
  key: string;
  reconciler: (original: S, rehydrated: Partial<S>) => S;
  rehydrate: () => Operation<Result<unknown>>;
}

export function shallowReconciler<S extends AnyState>(
  original: S,
  persisted: Partial<S>,
): S {
  return { ...original, ...persisted };
}

export function createPersistor<S extends AnyState>(
  { adapter, key = "starfx", reconciler = shallowReconciler, allowlist = [] }:
    & Pick<PersistProps<S>, "adapter">
    & Partial<PersistProps<S>>,
): PersistProps<S> {
  function* rehydrate(): Operation<Result<undefined>> {
    const persistedState = yield* adapter.getItem(key);
    if (!persistedState.ok) {
      return Err(persistedState.error);
    }

    yield* updateStore<S>(function (state) {
      state = reconciler(state, persistedState.value);
    });

    return Ok(undefined);
  }

  return {
    key,
    adapter,
    allowlist,
    reconciler,
    rehydrate,
  };
}

export function persistStoreMdw<S extends AnyState>(
  { allowlist, adapter, key }: PersistProps<S>,
) {
  return function* (_: UpdaterCtx<S>, next: Next) {
    yield* next();
    const state = yield* select((s: S) => s);
    // empty allowlist list means save entire state
    if (allowlist.length === 0) {
      yield* adapter.setItem(key, state);
      return;
    }

    const allowedState = allowlist.reduce<Partial<S>>((acc, key) => {
      acc[key] = state[key];
      return acc;
    }, {});
    yield* adapter.setItem(key, allowedState);
  };
}
