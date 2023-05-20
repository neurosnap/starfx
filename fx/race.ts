import type { Operation, Task } from "../deps.ts";
import { action, resource, spawn } from "../deps.ts";

import type { OpFn } from "../types.ts";
import { toOperation } from "./call.ts";

interface OpMap<T = unknown> {
  [key: string]: OpFn<T>;
}

export function race(
  opMap: OpMap,
): Operation<{ [K in keyof OpMap<unknown>]: ReturnType<OpMap[K]> }> {
  return resource(function* Race(provide) {
    const keys = Object.keys(opMap);
    const taskMap: { [key: string]: Task<unknown> } = {};
    const resultMap: { [key: keyof OpMap]: OpMap[keyof OpMap] } = {};

    const winner = yield* action<Task<unknown>>(function* (resolve) {
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        yield* spawn(function* () {
          const task = yield* spawn(() => toOperation(opMap[key]));
          taskMap[key] = task;
          (resultMap as any)[key] = yield* task;
          resolve(task);
        });
      }
    });

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const task = taskMap[key];
      if (task === winner) {
        continue;
      }

      yield* spawn(() => task.halt());
    }

    yield* provide(resultMap);
  });
}
