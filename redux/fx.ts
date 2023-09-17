import type { Action, Operation, Signal } from "../deps.ts";
import { createContext, each, spawn } from "../deps.ts";
import { call } from "../fx/mod.ts";
import { ActionPattern, matcher } from "../matcher.ts";
import type { ActionWPayload, AnyAction } from "../types.ts";

import type { StoreLike } from "./types.ts";

export const ActionContext = createContext<Signal<Action, void>>(
  "redux:action",
);
export const StoreContext = createContext<StoreLike>("redux:store");

export function emit({
  signal,
  action,
}: {
  signal: Signal<AnyAction, void>;
  action: AnyAction | AnyAction[];
}) {
  if (Array.isArray(action)) {
    if (action.length === 0) {
      return;
    }
    action.map((a) => signal.send(a));
  } else {
    signal.send(action);
  }
}

export function* once({
  signal,
  pattern,
}: {
  signal: Signal<Action, void>;
  pattern: ActionPattern;
}) {
  for (const action of yield* each(signal.stream)) {
    const match = matcher(pattern);
    if (match(action)) {
      return action;
    }
    yield* each.next;
  }
}

export function* select<S, R>(selectorFn: (s: S) => R) {
  const store = yield* StoreContext;
  return selectorFn(store.getState() as S);
}

export function take<P>(pattern: ActionPattern): Operation<ActionWPayload<P>>;
export function* take(pattern: ActionPattern): Operation<Action> {
  const signal = yield* ActionContext;
  const action = yield* once({
    signal,
    pattern,
  });
  return action as Action;
}

export function* takeEvery<T>(
  pattern: ActionPattern,
  op: (action: Action) => Operation<T>,
) {
  return yield* spawn(function* (): Operation<void> {
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
  return yield* spawn(function* (): Operation<void> {
    let lastTask;
    while (true) {
      const action = yield* take(pattern);
      if (lastTask) {
        yield* lastTask.halt();
      }
      if (!action) continue;
      lastTask = yield* spawn(() => op(action));
    }
  });
}
export const latest = takeLatest;

export function* takeLeading<T>(
  pattern: ActionPattern,
  op: (action: Action) => Operation<T>,
) {
  return yield* spawn(function* (): Operation<void> {
    while (true) {
      const action = yield* take(pattern);
      if (!action) continue;
      yield* call(() => op(action));
    }
  });
}
export const leading = takeLeading;

export function* put(action: AnyAction | AnyAction[]) {
  const store = yield* StoreContext;
  if (Array.isArray(action)) {
    action.map((act) => store.dispatch(act));
  } else {
    store.dispatch(action);
  }
}
