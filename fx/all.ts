import type { Channel, Operation, Result } from "../deps.ts";
import { createChannel, resource, spawn } from "../deps.ts";
import { safe } from "./call.ts";
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

interface ParallelRet<T> {
  wait: () => Operation<Result<T>[]>;
  sequence: Channel<Result<T>, void>;
  immediate: Channel<Result<T>, void>;
}

export function* parallel<T>(operations: OpFn<T>[]): Operation<ParallelRet<T>> {
  const sequence = createChannel<Result<T>>();
  const immediate = createChannel<Result<T>>();
  const results: Result<T>[] = [];

  const task = yield* spawn(function* () {
    const tasks = [];
    for (const op of operations) {
      tasks.push(
        yield* spawn(function* () {
          const result = yield* safe(op);
          yield* immediate.input.send(result);
          return result;
        }),
      );
    }

    for (const tsk of tasks) {
      const res = yield* tsk;
      results.push(res);
      yield* sequence.input.send(res);
    }

    yield* sequence.input.close();
    yield* immediate.input.close();
  });

  function* wait(): Operation<Result<T>[]> {
    yield* task;
    return results;
  }

  return { wait, sequence, immediate };
}
