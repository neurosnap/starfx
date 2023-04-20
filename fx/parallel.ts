import type { Channel, Operation, Result } from "../deps.ts";
import type { Computation, OpFn } from "../types.ts";
import { createChannel, resource, spawn } from "../deps.ts";
import { call } from "./call.ts";

interface ParallelRet<T> extends Computation<Result<T>[]> {
  sequence: Channel<Result<T>, void>;
  immediate: Channel<Result<T>, void>;
}

export function parallel<T>(operations: OpFn<T>[]) {
  const sequence = createChannel<Result<T>>();
  const immediate = createChannel<Result<T>>();
  const results: Result<T>[] = [];

  return resource<ParallelRet<T>>(function* (provide) {
    const task = yield* spawn(function* () {
      const tasks = [];
      for (const op of operations) {
        tasks.push(
          yield* spawn(function* () {
            const result = yield* call(op);
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

    yield* provide({
      sequence,
      immediate,
      *[Symbol.iterator]() {
        return yield* wait();
      },
    });
  });
}
