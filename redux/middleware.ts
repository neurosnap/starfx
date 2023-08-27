import {
  Action,
  AnyAction,
  BATCH,
  ConfigureEnhancersCallback,
  Middleware,
  ReducersMapObject,
  Scope,
  StoreEnhancer,
} from "../deps.ts";
import {
  combineReducers,
  configureStore as reduxStore,
  createScope,
  enableBatching,
} from "../deps.ts";
import { parallel } from "../fx/mod.ts";

import { ActionContext, emit, StoreContext, StoreLike } from "./fx.ts";
import { reducers as queryReducers } from "./query.ts";

function* send(action: AnyAction) {
  if (action.type === BATCH) {
    const actions: Action[] = action.payload;
    const group = yield* parallel(
      actions.map(
        (a) =>
          function* () {
            yield* emit({
              channel: ActionContext,
              action: a,
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

  function middleware<S = unknown, T = unknown>(store: StoreLike<S>) {
    scope.set(StoreContext, store);

    return (next: (a: Action) => T) => (action: Action) => {
      const result = next(action); // hit reducers
      scope.run(function* () {
        yield* send(action);
      });
      return result;
    };
  }

  return { scope, middleware, run: scope.run };
}

// deno-lint-ignore no-explicit-any
interface SetupStoreProps<S = any> {
  reducers: ReducersMapObject<S>;
  middleware?: Middleware[];
  enhancers?: StoreEnhancer[] | ConfigureEnhancersCallback;
  initialState?: S;
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
 * import { configureStore } from 'starfx/redux';
 *
 * const { store, fx } = prepareStore({
 *  reducers: { users: (state, action) => state },
 * });
 *
 * fx.run(function*() {
 *  yield* put({ type: 'LOADING' });
 *  yield* fetch('https://bower.sh');
 *  yield* put({ type: 'LOADING_COMPLETE' });
 * });
 * ```
 */
export function configureStore(
  { reducers, middleware = [], enhancers = [], initialState }: SetupStoreProps,
) {
  const fx = createFxMiddleware();
  const rootReducer = combineReducers({ ...queryReducers, ...reducers });
  const store = reduxStore({
    reducer: enableBatching(rootReducer),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat([fx.middleware, ...middleware]),
    enhancers,
    preloadedState: initialState,
  });

  return { store, fx };
}
