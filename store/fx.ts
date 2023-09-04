import { Channel, filter, Operation, spawn, Stream, Task } from "../deps.ts";
import { call, parallel } from "../fx/mod.ts";
import { ActionPattern, matcher } from "../matcher.ts";
import type { ActionWPayload, AnyAction, AnyState } from "../types.ts";

import type { FxStore, StoreUpdater, UpdaterCtx } from "./types.ts";
import { ActionContext, StoreContext } from "./context.ts";

export function* updateStore<S extends AnyState>(
  updater: StoreUpdater<S> | StoreUpdater<S>[],
): Operation<UpdaterCtx<S>> {
  const store = yield* StoreContext;
  // had to cast the store since StoreContext has a generic store type
  const st = store as FxStore<S>;
  const ctx = yield* st.update(updater);
  return ctx;
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
    const group = yield* parallel(
      action.map((a) => () => input.send(a)),
    );
    yield* group;
  } else {
    yield* input.send(action);
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

export function* useActions(pattern: ActionPattern): Stream<AnyAction, void> {
  const match = matcher(pattern);
  const { output } = yield* ActionContext;
  // deno-lint-ignore require-yield
  function* fn(a: AnyAction) {
    return match(a);
  }
  // return a subscription to the filtered actions.
  const result = yield* filter(fn)(output);
  return result;
}

export function take<P>(pattern: ActionPattern): Operation<ActionWPayload<P>>;
export function* take(pattern: ActionPattern): Operation<AnyAction> {
  const actions = yield* useActions(pattern);
  const first = yield* actions.next();
  return first.value as AnyAction;
}

export function takeEvery<T>(
  pattern: ActionPattern,
  op: (action: AnyAction) => Operation<T>,
): Operation<Task<void>> {
  return spawn(function* () {
    const actions = yield* useActions(pattern);
    let next = yield* actions.next();
    while (!next.done) {
      yield* spawn(() => op(next.value as AnyAction));
      next = yield* actions.next();
    }
  });
}

export function* takeLatest<T>(
  pattern: ActionPattern,
  op: (action: AnyAction) => Operation<T>,
): Operation<Task<void>> {
  return yield* spawn(function* () {
    const actions = yield* useActions(pattern);

    let lastTask: Task<T> | undefined;
    while (true) {
      const action = yield* actions.next();
      if (action.done) {
        return;
      }
      if (lastTask) {
        yield* lastTask.halt();
      }
      lastTask = yield* spawn(() => op(action.value));
    }
  });
}

export function* takeLeading<T>(
  pattern: ActionPattern,
  op: (action: AnyAction) => Operation<T>,
): Operation<Task<void>> {
  return yield* spawn(function* (): Operation<void> {
    while (true) {
      const action = yield* take(pattern);
      if (!action) continue;
      yield* call(() => op(action));
    }
  });
}

export function* apply<S, R, P>(actionFn: (s: S, p?: P) => R, p?: P) {
  const store = yield* StoreContext;
  actionFn(store.getState() as S, p);
}