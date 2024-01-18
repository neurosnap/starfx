import {
  call,
  createContext,
  each,
  Operation,
  Signal,
  SignalQueueFactory,
  spawn,
  Stream,
} from "./deps.ts";
import { ActionPattern, matcher } from "./matcher.ts";
import type { Action, ActionWithPayload, AnyAction } from "./types.ts";
import { createFilterQueue } from "./queue.ts";

export const ActionContext = createContext<Signal<AnyAction, void>>(
  "starfx:action",
);

export function useActions(pattern: ActionPattern): Stream<AnyAction, void> {
  return {
    *subscribe() {
      const actions = yield* ActionContext;
      const match = matcher(pattern);
      yield* SignalQueueFactory.set(() => createFilterQueue(match) as any);
      return yield* actions.subscribe();
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
  const signal = yield* ActionContext;
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
  op: (action: Action) => Operation<T>,
) {
  return yield* spawn(function* (): Operation<void> {
    const fd = useActions(pattern);
    for (const action of yield* each(fd)) {
      yield* spawn(() => op(action));
      yield* each.next();
    }
  });
}

export function* takeLatest<T>(
  pattern: ActionPattern,
  op: (action: Action) => Operation<T>,
) {
  return yield* spawn(function* (): Operation<void> {
    const fd = useActions(pattern);
    let lastTask;

    for (const action of yield* each(fd)) {
      if (lastTask) {
        yield* lastTask.halt();
      }
      lastTask = yield* spawn(() => op(action));
      yield* each.next();
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
      yield* call(() => op(action));
    }
  });
}
export const leading = takeLeading;

export const API_ACTION_PREFIX = "@@starfx";
export const createAction = (curType: string) => {
  if (!curType) throw new Error("createAction requires non-empty string");
  const type = `${API_ACTION_PREFIX}/${curType}`;
  const action = () => ({ type });
  action.toString = () => type;
  return action;
};
