import { Err, Ok, type Operation, type Result } from "../deps.ts";
import type { AnyState, Next } from "../types.ts";
import { select, updateStore } from "./fx.ts";
import type { UpdaterCtx } from "./types.ts";

export const PERSIST_LOADER_ID = "@@starfx/persist";

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

export function createLocalStorageAdapter<S extends AnyState>(): PersistAdapter<
  S
> {
  return {
    getItem: function* (key: string) {
      const storage = localStorage.getItem(key) || "{}";
      return Ok(JSON.parse(storage));
    },
    setItem: function* (key: string, s: Partial<S>) {
      const state = JSON.stringify(s);
      try {
        localStorage.setItem(key, state);
      } catch (err: any) {
        return Err(err);
      }
      return Ok(undefined);
    },
    removeItem: function* (key: string) {
      localStorage.removeItem(key);
      return Ok(undefined);
    },
  };
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

    const state = yield* select((s) => s);
    const nextState = reconciler(state as S, persistedState.value);
    yield* updateStore<S>(function (state) {
      Object.keys(nextState).forEach((key: keyof S) => {
        state[key] = nextState[key];
      });
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
