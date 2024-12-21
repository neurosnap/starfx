import { Callable, Operation, Result, Scope, Task } from "effection";
import { parallel, safe } from "../fx/mod.ts";

export function createRun(scope: Scope) {
  function run<T>(op: Callable<T>[]): Task<Result<T>[]>;
  function run<T>(op: Callable<T>): Task<Result<T>>;
  function run<T>(
    op: Callable<T> | Callable<T>[]
  ): Task<Result<T> | Result<T>[]> {
    if (Array.isArray(op)) {
      return scope.run(function* (): Operation<Result<T>[]> {
        const group = yield* parallel(op);
        const result = yield* group;
        return result;
      });
    }
    return scope.run(() => safe(op));
  }

  return run;
}
