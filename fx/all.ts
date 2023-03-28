import type { Operation } from "../deps.ts";
import { resource, spawn } from "../deps.ts";
import type { OpFn } from "../types.ts";
import { map } from "../iter.ts";

import { toOperation } from "./call.ts";

export function all<T>(operations: OpFn<T>[]): Operation<T[]> {
  return resource(function* All(provide) {
    const tasks = yield* map(
      operations.map((o) => () => toOperation(o)),
      spawn,
    );

    const results = yield* map(tasks, (task) => task);

    yield* provide(results);
  });
}
