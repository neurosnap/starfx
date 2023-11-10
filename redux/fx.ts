import type { Action, Operation, Queue, Signal, Stream } from "../deps.ts";
import {
  createContext,
  createQueue,
  each,
  SignalQueueFactory,
  spawn,
} from "../deps.ts";
import { call } from "../fx/mod.ts";
import { ActionPattern, matcher } from "../matcher.ts";
import type { ActionWPayload, AnyAction } from "../types.ts";
import type { StoreLike } from "./types.ts";

export const ActionContext = createContext<Signal<Action, void>>(
  "redux:action",
);
export const StoreContext = createContext<StoreLike>("redux:store");

function createFilterQueue<T, TClose>(
  predicate: (a: T) => boolean,
): Queue<T, TClose> {
  const queue = createQueue<T, TClose>();

  return {
    ...queue,
    add(value: T) {
      if (predicate(value)) {
        queue.add(value);
      }
    },
  };
}

export function* put(action: AnyAction | AnyAction[]) {
  const store = yield* StoreContext;
  if (Array.isArray(action)) {
    action.map((act) => store.dispatch(act));
  } else {
    store.dispatch(action);
  }
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

export function* select<S, R>(selectorFn: (s: S) => R) {
  const store = yield* StoreContext;
  return selectorFn(store.getState() as S);
}

function useActions(pattern: ActionPattern): Stream<AnyAction, void> {
  return {
    *subscribe() {
      const actions = yield* ActionContext;
      const match = matcher(pattern);
      yield* SignalQueueFactory.set(() =>
        createFilterQueue<AnyAction, void>(match) as any
      );
      return yield* actions.subscribe();
    },
  };
}

export function take<P>(pattern: ActionPattern): Operation<ActionWPayload<P>>;
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
