import type { Channel, Operation, Scope } from "./deps.ts";
import { createChannel, createContext, createScope } from "./deps.ts";
import { contextualize } from "./context.ts";
import { all, emit, once, safe } from "./fx/mod.ts";
import type { Action, StoreLike } from "./types.ts";
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

function supervise(op: () => Operation<void>) {
  return function* keepAlive() {
    while (true) {
      yield* safe(op);
    }
  };
}

export function createFxMiddleware(scope: Scope = createScope()) {
  function run(ops: (() => Operation<void>)[]) {
    const task = scope.run(function* runner() {
      yield* all(ops.map(supervise));
    });

    return task;
  }

  function middleware<S = unknown, T = unknown>(store: StoreLike<S>) {
    scope.run(function* () {
      yield* contextualize("store", store);
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
