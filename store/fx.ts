import { Operation, Result } from "../deps.ts";
import type { ActionFnWithPayload, AnyState } from "../types.ts";
import type { FxStore, StoreUpdater, UpdaterCtx } from "./types.ts";
import { StoreContext } from "./context.ts";
import { LoaderOutput } from "./slice/loader.ts";
import { parallel, safe } from "../fx/mod.ts";
import { getIdFromAction, ThunkAction } from "../query/mod.ts";
import { take } from "../action.ts";

export function* updateStore<S extends AnyState>(
  updater: StoreUpdater<S> | StoreUpdater<S>[],
): Operation<UpdaterCtx<S>> {
  const store = yield* StoreContext;
  // had to cast the store since StoreContext has a generic store type
  const st = store as FxStore<S>;
  const ctx = yield* st.update(updater);
  return ctx;
}

export function select<S, R>(selectorFn: (s: S) => R): Operation<R>;
export function select<S, R, P>(
  selectorFn: (s: S, p: P) => R,
  p: P,
): Operation<R>;
export function* select<S, R, P>(
  selectorFn: (s: S, p?: P) => R,
  p?: P,
): Operation<R> {
  const store = yield* StoreContext;
  return selectorFn(store.getState() as S, p);
}

export function* waitForLoader<M extends AnyState>(
  loaders: LoaderOutput<M, AnyState>,
  action: ThunkAction | ActionFnWithPayload,
) {
  const id = getIdFromAction(action);
  const selector = (s: AnyState) => loaders.selectById(s, { id });

  // check for done state on init
  let loader = yield* select(selector);
  if (loader.isSuccess || loader.isError) {
    return loader;
  }

  while (true) {
    yield* take("*");
    loader = yield* select(selector);
    if (loader.isSuccess || loader.isError) {
      return loader;
    }
  }
}

export function* waitForLoaders<M extends AnyState>(
  loaders: LoaderOutput<M, AnyState>,
  actions: (ThunkAction | ActionFnWithPayload)[],
) {
  const group = yield* parallel(
    actions.map((action) => waitForLoader(loaders, action)),
  );
  return yield* group;
}

export function createTracker<T, M extends Record<string, unknown>>(
  loader: LoaderOutput<M, AnyState>,
) {
  return (id: string) => {
    return function* (op: () => Operation<Result<T>>) {
      yield* updateStore(loader.start({ id }));
      const result = yield* safe(op);
      if (result.ok) {
        yield* updateStore(loader.success({ id }));
      } else {
        yield* updateStore(
          loader.error({
            id,
            message: result.error.message,
          }),
        );
      }
      return result;
    };
  };
}
