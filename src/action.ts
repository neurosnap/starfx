import {
  type Callable,
  type Operation,
  type Signal,
  SignalQueueFactory,
  type Stream,
  call,
  createContext,
  createSignal,
  each,
  spawn,
} from "effection";
import { type ActionPattern, matcher } from "./matcher.js";
import { createFilterQueue } from "./queue.js";
import type { Action, ActionWithPayload, AnyAction } from "./types.js";
import type { ActionFnWithPayload } from "./types.js";

export const ActionContext = createContext(
  "starfx:action",
  createSignal<AnyAction, void>(),
);

export function useActions(pattern: ActionPattern): Stream<AnyAction, void> {
  return {
    [Symbol.iterator]: function* () {
      const actions = yield* ActionContext.expect();
      const match = matcher(pattern);
      yield* SignalQueueFactory.set(() => createFilterQueue(match) as any);
      return yield* actions;
    },
  };
}

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

export function* put(action: AnyAction | AnyAction[]) {
  const signal = yield* ActionContext.expect();
  return emit({
    signal,
    action,
  });
}

export function take<P>(
  pattern: ActionPattern,
): Operation<ActionWithPayload<P>>;
export function* take(pattern: ActionPattern): Operation<Action> {
  const fd = useActions(pattern);
  for (const action of yield* each(fd)) {
    return action;
  }
  return { type: "take failed, this should not be possible" };
}

export function* takeEvery<T>(
  pattern: ActionPattern,
  op: (action: AnyAction) => Operation<T>,
) {
  const fd = useActions(pattern);
  for (const action of yield* each(fd)) {
    yield* spawn(() => op(action));
    yield* each.next();
  }
}

export function* takeLatest<T>(
  pattern: ActionPattern,
  op: (action: AnyAction) => Operation<T>,
) {
  const fd = useActions(pattern);
  let lastTask;

  for (const action of yield* each(fd)) {
    if (lastTask) {
      yield* lastTask.halt();
    }
    lastTask = yield* spawn(() => op(action));
    yield* each.next();
  }
}

export function* takeLeading<T>(
  pattern: ActionPattern,
  op: (action: AnyAction) => Operation<T>,
) {
  while (true) {
    const action = yield* take(pattern);
    yield* call(() => op(action));
  }
}

export function* waitFor(predicate: Callable<boolean>) {
  const init = yield* call(predicate as any);
  if (init) {
    return;
  }

  while (true) {
    yield* take("*");
    const result = yield* call(predicate as any);
    if (result) {
      return;
    }
  }
}

export function getIdFromAction(
  action: ActionWithPayload<{ key: string }> | ActionFnWithPayload,
): string {
  return typeof action === "function" ? action.toString() : action.payload.key;
}

export const API_ACTION_PREFIX = "";

export function createAction(actionType: string): () => Action;
export function createAction<P>(
  actionType: string,
): (p: P) => ActionWithPayload<P>;
export function createAction(actionType: string) {
  if (!actionType) {
    throw new Error("createAction requires non-empty string");
  }
  const fn = (payload?: unknown) => ({
    type: actionType,
    payload,
  });
  fn.toString = () => actionType;
  Object.defineProperty(fn, "_starfx", {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return fn;
}
