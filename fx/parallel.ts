import type { Callable, Channel, Operation, Result } from "../deps.ts";
import type { Computation } from "../types.ts";
import { createChannel, resource, spawn } from "../deps.ts";

import { safe } from "./call.ts";

export interface ParallelRet<T> extends Computation<Result<T>[]> {
  sequence: Channel<Result<T>, void>;
  immediate: Channel<Result<T>, void>;
}

export function parallel<T>(operations: Callable<T>[]) {
  const sequence = createChannel<Result<T>>();
  const immediate = createChannel<Result<T>>();
  const results: Result<T>[] = [];

  return resource<ParallelRet<T>>(function* (provide) {
    const task = yield* spawn(function* () {
      const tasks = [];
      for (const op of operations) {
        tasks.push(
          yield* spawn(function* () {
            const result = yield* safe(op);
            yield* immediate.send(result);
            return result;
          }),
        );
      }

      for (const tsk of tasks) {
        const res = yield* tsk;
        results.push(res);
        yield* sequence.send(res);
      }

      yield* sequence.close();
      yield* immediate.close();
    });

    function* wait(): Operation<Result<T>[]> {
      yield* task;
      return results;
    }

    yield* provide({
      sequence,
      immediate,
      *[Symbol.iterator]() {
        return yield* wait();
      },
    });
  });
}
