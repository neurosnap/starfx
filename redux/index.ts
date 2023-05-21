import {
  BATCH,
  Channel,
  Middleware,
  Operation,
  ReducersMapObject,
  Scope,
} from "../deps.ts";
import type { Action, ActionWPayload, OpFn, StoreLike } from "../types.ts";
import type { ActionPattern } from "../matcher.ts";

import {
  combineReducers,
  configureStore as reduxStore,
  createChannel,
  createContext,
  createScope,
  enableBatching,
  spawn,
} from "../deps.ts";
import { contextualize } from "../context.ts";
import { call, cancel, emit, parallel } from "../fx/index.ts";
import { once } from "../iter.ts";
import { reducers as queryReducers } from "../query/index.ts";

export const ActionContext = createContext<Channel<Action, void>>(
  "redux:action",
  createChannel<Action, void>(),
);

export const StoreContext = createContext<StoreLike>("redux:store");

export function* select<S, R>(selectorFn: (s: S) => R) {
  const store = yield* StoreContext;
  return selectorFn(store.getState() as S);
}

export function take<P>(pattern: ActionPattern): Operation<ActionWPayload<P>>;
export function* take(pattern: ActionPattern): Operation<Action> {
  const action = yield* once({
    channel: ActionContext,
    pattern,
  });
  return action as Action;
}

export function* takeEvery<T>(
  pattern: ActionPattern,
  op: (action: Action) => Operation<T>,
) {
  return yield* spawn(function* () {
    while (true) {
      const action = yield* take(pattern);
      if (!action) continue;
      yield* spawn(() => op(action));
    }
  });
}

export function* takeLatest<T>(
  pattern: ActionPattern,
  op: (action: Action) => Operation<T>,
) {
  return yield* spawn(function* () {
    let lastTask;
    while (true) {
      const action = yield* take(pattern);
      if (lastTask) {
        yield* cancel(lastTask);
      }
      if (!action) continue;
      lastTask = yield* spawn(() => op(action));
    }
  });
}

export function* takeLeading<T>(
  pattern: ActionPattern,
  op: (action: Action) => Operation<T>,
) {
  return yield* spawn(function* () {
    while (true) {
      const action = yield* take(pattern);
      if (!action) continue;
      yield* call(() => op(action));
    }
  });
}

export function* put(action: Action | Action[]) {
  const store = yield* StoreContext;
  if (Array.isArray(action)) {
    action.map((act) => store.dispatch(act));
  } else {
    store.dispatch(action);
  }
  yield* emit({
    channel: ActionContext,
    action,
  });
}

function* send(action: Action) {
  if (action.type === BATCH) {
    const actions: Action[] = action.payload;
    yield* parallel(
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
  } else {
    yield* emit({
      channel: ActionContext,
      action,
    });
  }
}

export function createFxMiddleware(scope: Scope = createScope()) {
  function run<T>(op: OpFn<T>) {
    const task = scope.run(function* runner() {
      return yield* call(op);
    });

    return task;
  }

  function middleware<S = unknown, T = unknown>(store: StoreLike<S>) {
    scope.run(function* () {
      yield* contextualize("redux:store", store);
    });

    return (next: (a: Action) => T) => (action: Action) => {
      const result = next(action); // hit reducers
      scope.run(function* () {
        yield* send(action);
      });
      return result;
    };
  }

  return { run, scope, middleware };
}

// deno-lint-ignore no-explicit-any
interface SetupStoreProps<S = any> {
  reducers: ReducersMapObject<S>;
  middleware?: Middleware[];
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
export function configureStore({ reducers, middleware = [] }: SetupStoreProps) {
  const fx = createFxMiddleware();
  const rootReducer = combineReducers({ ...queryReducers, ...reducers });
  const store = reduxStore({
    reducer: enableBatching(rootReducer),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat([fx.middleware, ...middleware]),
  });

  return { store, fx };
}
