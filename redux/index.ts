import { BATCH, Channel, Instruction, Operation, Scope } from "../deps.ts";
import type { Action, ActionWPayload, OpFn, StoreLike } from "../types.ts";
import type { ActionPattern } from "../matcher.ts";

import {
  configureStore,
  createChannel,
  createContext,
  createScope,
  spawn,
} from "../deps.ts";
import { contextualize } from "../context.ts";
import { call, cancel, emit, parallel } from "../fx/index.ts";
import { once } from "../iter.ts";

export const ActionContext = createContext<Channel<Action, void>>(
  "redux:action",
  createChannel<Action, void>(),
);

export const StoreContext = createContext<StoreLike>("redux:store");

export function* select<S, R>(selectorFn: (s: S) => R) {
  const store = yield* StoreContext;
  return selectorFn(store.getState() as S);
}

// https://github.com/microsoft/TypeScript/issues/31751#issuecomment-498526919
export function* take<P = never>(
  pattern: ActionPattern,
): Generator<
  Instruction,
  [P] extends [never] ? Action : ActionWPayload<P>
> {
  const action = yield* once({
    channel: ActionContext,
    pattern,
  });
  return action as any;
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

interface SetupStoreProps<S = unknown> {
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
