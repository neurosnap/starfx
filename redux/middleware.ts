import {
  Action,
  BATCH,
  BatchAction,
  ReducersMapObject,
  Scope,
} from "../deps.ts";
import { combineReducers, createScope, enableBatching } from "../deps.ts";
import { parallel } from "../fx/mod.ts";
import type { AnyAction } from "../types.ts";

import { ActionContext, emit, StoreContext } from "./fx.ts";
import { reducers as queryReducers } from "./query.ts";
import type { StoreLike } from "./types.ts";

function* send(action: AnyAction) {
  if (action.type === BATCH) {
    const actions = action.payload as BatchAction[];
    const group = yield* parallel(
      actions.map(
        (a) =>
          function* () {
            yield* emit({
              channel: ActionContext,
              action: a as Action,
            });
          },
      ),
    );
    yield* group;
  } else {
    yield* emit({
      channel: ActionContext,
      action,
    });
  }
}

export function createFxMiddleware(initScope?: Scope) {
  let scope: Scope;
  if (initScope) {
    scope = initScope;
  } else {
    const tuple = createScope();
    scope = tuple[0];
  }

  function middleware<S = unknown>(store: StoreLike<S>) {
    scope.set(StoreContext, store);

    return (next: (a: unknown) => unknown) => (action: unknown) => {
      const result = next(action); // hit reducers
      scope.run(function* () {
        yield* send(action as AnyAction);
      });
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
