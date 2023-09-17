import {
  BATCH,
  BatchAction,
  combineReducers,
  createScope,
  createSignal,
  enableBatching,
  ReducersMapObject,
  Scope,
  Signal,
} from "../deps.ts";
import type { AnyAction } from "../types.ts";
import { ActionContext, emit, StoreContext } from "./fx.ts";
import { reducers as queryReducers } from "./query.ts";
import type { StoreLike } from "./types.ts";

export function send(signal: Signal<AnyAction, void>, act: AnyAction) {
  let action: AnyAction | AnyAction[] = act;
  if (act.type === BATCH) {
    action = act.payload as BatchAction[];
  }
  emit({
    signal,
    action,
  });
}

export function createFxMiddleware(initScope?: Scope) {
  let scope: Scope;
  if (initScope) {
    scope = initScope;
  } else {
    const tuple = createScope();
    scope = tuple[0];
  }
  const signal = createSignal<AnyAction, void>();

  function middleware<S = unknown>(store: StoreLike<S>) {
    scope.set(StoreContext, store);
    scope.set(ActionContext, signal);

    return (next: (a: unknown) => unknown) => (action: unknown) => {
      const result = next(action); // hit reducers
      send(signal, action as AnyAction);
      return result;
    };
  }

  return { scope, middleware, run: scope.run };
}

// deno-lint-ignore no-explicit-any
interface SetupStoreProps<S = any> {
  reducers: ReducersMapObject<S>;
}

/**
 * This function will integrate `starfx` and `redux`.
 *
 * In order to enable `starfx/query`, it will add some reducers to your `redux`
 * store for decoupled loaders and a simple data cache.
 *
 * It also adds `redux-batched-actions` which is critical for `starfx`.
 *
 * @example
 * ```ts
 * import { prepareStore } from 'starfx/redux';
 *
 * const { reducer, fx } = prepareStore({
 *  reducers: { users: (state, action) => state },
 * });
 *
 * const store = configureStore({
 *  reducer,
 *  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(fx),
 * });
 *
 * fx.run(function*() {
 *  yield* put({ type: 'LOADING' });
 *  yield* fetch('https://bower.sh');
 *  yield* put({ type: 'LOADING_COMPLETE' });
 * });
 * ```
 */
export function prepareStore(
  { reducers }: SetupStoreProps,
) {
  const fx = createFxMiddleware();
  const reducer = enableBatching(
    combineReducers({ ...queryReducers, ...reducers }),
  );
  return { reducer, fx };
}
