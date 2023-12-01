import {
  Action,
  call,
  each,
  Operation,
  Result,
  Signal,
  SignalQueueFactory,
  spawn,
  Stream,
} from "../deps.ts";
import { ActionPattern, matcher } from "../matcher.ts";
import type { ActionWPayload, AnyAction, AnyState } from "../types.ts";
import type { FxStore, StoreUpdater, UpdaterCtx } from "./types.ts";
import { ActionContext, StoreContext } from "./context.ts";
import { createFilterQueue } from "../queue.ts";
import { LoaderOutput } from "./slice/loader.ts";
import { safe } from "../fx/mod.ts";

export function* updateStore<S extends AnyState>(
  updater: StoreUpdater<S> | StoreUpdater<S>[],
): Operation<UpdaterCtx<S>> {
  const store = yield* StoreContext;
  // had to cast the store since StoreContext has a generic store type
  const st = store as FxStore<S>;
  const ctx = yield* st.update(updater);
  return ctx;
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

export function select<S, R>(selectorFn: (s: S) => R): Operation<R>;
export function select<S, R, P>(
  selectorFn: (s: S, p: P) => R,
  p: P,
): Operation<R>;
export function* select<S, R, P>(
  selectorFn: (s: S, p?: P) => R,
  p?: P,
): Operation<R> {
  const store = yield* StoreContext;
  return selectorFn(store.getState() as S, p);
}

export function* put(action: AnyAction | AnyAction[]) {
  const signal = yield* ActionContext;
  return emit({
    signal,
    action,
  });
}

function useActions(pattern: ActionPattern): Stream<AnyAction, void> {
  return {
    *subscribe() {
      const actions = yield* ActionContext;
      const match = matcher(pattern);
      yield* SignalQueueFactory.set(() => createFilterQueue(match) as any);
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

export function createTracker<T, M extends Record<string, unknown>>(
  loader: LoaderOutput<M, AnyState>,
) {
  return (id: string) => {
    return function* (op: () => Operation<Result<T>>) {
      yield* updateStore(loader.start({ id }));
      const result = yield* safe(op);
      if (result.ok) {
        yield* updateStore(loader.success({ id }));
      } else {
        yield* updateStore(
          loader.error({
            id,
            message: result.error.message,
          }),
        );
      }
      return result;
    };
  };
}
