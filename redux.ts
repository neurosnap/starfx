import type { Channel, Operation, Scope } from "./deps.ts";
import type { Action, OpFn, StoreLike } from "./types.ts";
import type { ActionPattern } from "./matcher.ts";

import {
  configureStore,
  createChannel,
  createContext,
  createScope,
  spawn,
} from "./deps.ts";
import { contextualize } from "./context.ts";
import { call, cancel, emit, parallel } from "./fx/mod.ts";
import { once } from "./iter.ts";

export const ActionContext = createContext<Channel<Action, void>>(
  "redux:action",
  createChannel<Action, void>(),
);

export const StoreContext = createContext<StoreLike>("redux:store");

export function* select<S, R>(selectorFn: (s: S) => R) {
  const store = yield* StoreContext;
  return selectorFn(store.getState() as S);
}

export function* take(pattern: ActionPattern) {
  return yield* once({
    channel: ActionContext,
    pattern,
  });
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
  yield* emit({
    channel: ActionContext,
    action,
  });
}

export function createFxMiddleware(scope: Scope = createScope()) {
  function run<T>(op: OpFn<T>) {
    const task = scope.run(function* runner() {
      yield* call(op);
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
        if (Array.isArray(action)) {
          yield* parallel(action.map((a) => () => put(a)));
        } else {
          yield* put(action);
        }
      });
      return result;
    };
  }

  return { run, scope, middleware };
}

interface SetupStoreProps<S = any> {
  reducer: (s: S, _: Action) => S;
}

export function setupStore({ reducer }: SetupStoreProps) {
  const fx = createFxMiddleware();
  const store = configureStore({
    reducer,
    middleware: [fx.middleware],
  });

  return { store, fx };
}
