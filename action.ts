import {
  call,
  createContext,
  createSignal,
  each,
  type Operation,
  type Signal,
  SignalQueueFactory,
  spawn,
  type Stream,
} from "effection";
import { ActionPattern, matcher } from "./matcher.ts";
import type { Action, ActionWithPayload, AnyAction } from "./types.ts";
import { createFilterQueue } from "./queue.ts";
import { ActionFnWithPayload } from "./types.ts";

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
  const actionStream = useActions(pattern);
  const subscription = yield* actionStream;
  const result = yield* subscription.next();
  if (result.done) {
    return {
      type: "Action stream closed before a matching action was received",
    };
  }
  return result.value;
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

export function* waitFor(
  predicate: () => Operation<boolean>,
) {
  const init = yield* predicate();
  if (init) {
    return;
  }

  while (true) {
    yield* take("*");
    const result = yield* predicate();
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

  return fn;
}
