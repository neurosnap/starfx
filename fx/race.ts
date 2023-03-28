import type { Operation } from "../deps.ts";
import { action, resource, spawn } from "../deps.ts";

import type { OpFn } from "../types.ts";
import { map } from "../iter.ts";
import { toOperation } from "./call.ts";

export function race<T>(operations: OpFn<T>[]): Operation<T> {
  return resource(function* Race(provide) {
    const tasks = yield* map(
      operations.map((o) => () => toOperation(o)),
      spawn,
    );

    const winner = yield* action<T>(function* (resolve) {
      for (let task of tasks) {
        yield* spawn(function* () {
          resolve(yield* task);
        });
      }
    });

    for (let task of tasks) {
      if (task !== winner) {
        yield* spawn(() => task.halt());
      }
    }

    yield* provide(winner);
  });
}
