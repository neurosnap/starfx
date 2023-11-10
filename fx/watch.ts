import type { Operator } from "../types.ts";
import { safe } from "./call.ts";
import { parallel } from "./parallel.ts";

export function supervise<T>(op: Operator<T>) {
  return function* () {
    while (true) {
      yield* safe(op);
    }
  };
}

export function* keepAlive(ops: Operator<unknown>[]) {
  const results = yield* parallel(ops.map(supervise));
  return yield* results;
}
