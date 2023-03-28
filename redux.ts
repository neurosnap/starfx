import type { Channel, Scope } from "./deps.ts";
import { createChannel, createContext, createScope } from "./deps.ts";
import { contextualize } from "./context.ts";
import { call, emit, once } from "./fx/mod.ts";
import type { Action, OpFn, StoreLike } from "./types.ts";
import { ActionPattern } from "./matcher.ts";

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
        yield* put(action);
      });
      return result;
    };
  }

  return { run, scope, middleware };
}
