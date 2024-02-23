import { createAction, take } from "./action.ts";
import { call, Callable, Operation, race, sleep, spawn, Task } from "./deps.ts";
import type { ActionWithPayload, AnyAction } from "./types.ts";
import type { CreateActionPayload } from "./query/mod.ts";
import { getIdFromAction } from "./action.ts";

const MS = 1000;
const SECONDS = 1 * MS;
const MINUTES = 60 * SECONDS;

export function poll(parentTimer: number = 5 * SECONDS, cancelType?: string) {
  return function* poller<T>(
    actionType: string,
    op: (action: AnyAction) => Operation<T>,
  ): Operation<T> {
    const cancel = cancelType || actionType;
    function* fire(action: { type: string }, timer: number) {
      while (true) {
        yield* op(action);
        yield* sleep(timer);
      }
    }

    while (true) {
      const action = yield* take<{ timer?: number }>(actionType);
      const timer = action.payload?.timer || parentTimer;
      yield* race([
        fire(action, timer),
        take(`${cancel}`) as Operation<void>,
      ]);
    }
  };
}

export const clearTimers = createAction<string[]>("clear-timers");

/**
 * timer() will create a cache timer for each `key` inside
 * of a starfx api endpoint.  `key` is a hash of the action type and payload.
 *
 * Why do we want this?  If we have an api endpoint to fetch a single app: `fetchApp({ id: 1 })`
 * if we don't set a timer per key then all calls to `fetchApp` will be on a timer.
 * So if we call `fetchApp({ id: 1 })` and then `fetchApp({ id: 2 })` if we use a normal
 * cache timer then the second call will not send an http request.
 */
export function timer(timer: number = 5 * MINUTES) {
  return function* onTimer(
    actionType: string,
    op: (action: AnyAction) => Callable<unknown>,
  ) {
    const map: { [key: string]: Task<unknown> } = {};

    function* activate(action: ActionWithPayload<CreateActionPayload>) {
      yield* call(() => op(action));
      const idA = getIdFromAction(action);

      const matchFn = (act: AnyAction) => {
        if (act.type !== `${clearTimers}`) return false;
        if (!act.payload) return false;
        const ids: string[] = act.payload || [];
        return ids.some((id) => idA === id || id === "*");
      };
      yield* race([
        sleep(timer),
        take(matchFn) as Operation<void>,
      ]);

      delete map[action.payload.key];
    }

    while (true) {
      const action = yield* take<CreateActionPayload>(`${actionType}`);
      const key = action.payload.key;
      if (!map[key]) {
        const task = yield* spawn(function* () {
          yield* activate(action);
        });
        map[key] = task;
      }
    }
  };
}
