import { Action, Channel, Operation } from "../deps.ts";
import { createChannel, createContext, spawn } from "../deps.ts";
import { call, parallel } from "../fx/mod.ts";
import { ActionPattern, matcher } from "../matcher.ts";
import type { ActionWPayload, AnyAction } from "../types.ts";

import type { StoreLike } from "./types.ts";

export const ActionContext = createContext<Channel<Action, void>>(
  "redux:action",
  createChannel<Action, void>(),
);

export const StoreContext = createContext<StoreLike>("redux:store");

export function* emit({
  channel,
  action,
}: {
  channel: Operation<Channel<AnyAction, void>>;
  action: AnyAction | AnyAction[];
}) {
  const { input } = yield* channel;
  if (Array.isArray(action)) {
    if (action.length === 0) {
      return;
    }
    yield* parallel(action.map((a) => () => input.send(a)));
  } else {
    yield* input.send(action);
  }
}

export function* once({
  channel,
  pattern,
}: {
  channel: Operation<Channel<Action, void>>;
  pattern: ActionPattern;
}) {
  const { output } = yield* channel;
  const msgList = yield* output;
  let next = yield* msgList.next();
  while (!next.done) {
    const match = matcher(pattern);
    if (match(next.value)) {
      return next.value;
    }
    next = yield* msgList.next();
  }
}

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
