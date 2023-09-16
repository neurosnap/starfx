import { call, race } from "../fx/mod.ts";
import { take } from "./fx.ts";
import { Operation, sleep, spawn, Task } from "../deps.ts";
import type { ActionWPayload, AnyAction } from "../types.ts";
import type { CreateActionPayload, Supervisor } from "../query/mod.ts";

const MS = 1000;
const SECONDS = 1 * MS;
const MINUTES = 60 * SECONDS;

export function poll(
  parentTimer: number = 5 * 1000,
  cancelType?: string,
): Supervisor {
  return function* poller<T>(
    actionType: string,
    op: (action: AnyAction) => Operation<T>,
  ): Operation<T> {
    const cancel = cancelType || actionType;
    function* fire(action: { type: string }, timer: number) {
      while (true) {
        yield* call(() => op(action));
        yield* sleep(timer);
      }
    }

    while (true) {
      const action = yield* take<{ timer?: number }>(actionType);
      const timer = action.payload?.timer || parentTimer;
      yield* race({
        fire: () => call(() => fire(action, timer)),
        cancel: () => take(`${cancel}`),
      });
    }
  };
}

/**
 * timer() will create a cache timer for each `key` inside
 * of a saga-query api endpoint.  `key` is a hash of the action type and payload.
 *
 * Why do we want this?  If we have an api endpoint to fetch a single app: `fetchApp({ id: 1 })`
 * if we don't set a timer per key then all calls to `fetchApp` will be on a timer.
 * So if we call `fetchApp({ id: 1 })` and then `fetchApp({ id: 2 })` if we use a normal
 * cache timer then the second call will not send an http request.
 */
export function timer(timer: number = 5 * MINUTES): Supervisor {
  return function* onTimer<T>(
    actionType: string,
    op: (action: AnyAction) => Operation<T>,
  ) {
    const map: { [key: string]: Task<unknown> } = {};

    function* activate(action: ActionWPayload<CreateActionPayload>) {
      yield* call(() => op(action));
      yield* sleep(timer);
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
