import type { Operation, Task } from "../deps.ts";
import { call, resource, spawn, withResolvers } from "../deps.ts";

interface OpMap<T = unknown> {
  [key: string]: Operation<T>;
}

export function raceMap<T>(opMap: OpMap): Operation<
  {
    [K in keyof OpMap<T>]: OpMap[K] extends (...args: any[]) => any
      ? ReturnType<OpMap[K]>
      : OpMap[K];
  }
> {
  return resource(function* Race(provide) {
    const keys = Object.keys(opMap);
    const taskMap: { [key: string]: Task<unknown> } = {};
    const resultMap: { [key: keyof OpMap]: OpMap[keyof OpMap] } = {};

    function* start() {
      const resolvers = withResolvers();

      yield* spawn(function* () {
        for (let i = 0; i < keys.length; i += 1) {
          const key = keys[i];
          yield* spawn(function* () {
            const task = yield* spawn(function* () {
              yield* call(opMap[key] as any);
            });
            taskMap[key] = task;
            (resultMap as any)[key] = yield* task;
            resolvers.resolve(task);
          });
        }
      });

      return yield* resolvers.operation;
    }

    const winner = yield* start();

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
