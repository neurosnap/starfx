import { Channel, Operation, spawn, Task } from "../deps.ts";
import { call, parallel } from "../fx/mod.ts";
import { ActionPattern, matcher } from "../matcher.ts";

import type {
  ActionWPayload,
  AnyAction,
  AnyState,
  StoreUpdater,
  UpdaterCtx,
} from "./types.ts";
import { ActionContext, StoreContext } from "./context.ts";

export function* updateStore<S extends AnyState>(
  updater: StoreUpdater<S> | StoreUpdater<S>[],
): Operation<UpdaterCtx<S>> {
  const store = yield* StoreContext;
  const ctx = yield* store.update(updater as any);
  // TODO: fix type
  return ctx as any;
}

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
  channel: Operation<Channel<AnyAction, void>>;
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

export function* select<S, R, P>(selectorFn: (s: S, p?: P) => R, p?: P) {
  const store = yield* StoreContext;
  return selectorFn(store.getState() as S, p);
}

export function* put(action: AnyAction | AnyAction[]) {
  return yield* emit({
    channel: ActionContext,
    action,
  });
}

export function take<P>(pattern: ActionPattern): Operation<ActionWPayload<P>>;
export function* take(pattern: ActionPattern): Operation<AnyAction> {
  const action = yield* once({
    channel: ActionContext,
    pattern,
  });
  return action as AnyAction;
}

export function* takeEvery<T>(
  pattern: ActionPattern,
  op: (action: AnyAction) => Operation<T>,
): Operation<Task<void>> {
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
  op: (action: AnyAction) => Operation<T>,
): Operation<Task<void>> {
  return yield* spawn(function* () {
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

export function* takeLeading<T>(
  pattern: ActionPattern,
  op: (action: AnyAction) => Operation<T>,
): Operation<Task<void>> {
  return yield* spawn(function* () {
    while (true) {
      const action = yield* take(pattern);
      if (!action) continue;
      yield* call(() => op(action));
    }
  });
}
