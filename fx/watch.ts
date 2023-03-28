import { OpFn } from "../types.ts";

import { safe } from "./call.ts";
import { all } from "./all.ts";

export function supervise<T>(op: OpFn<T>) {
  return function* () {
    while (true) {
      yield* safe(op);
    }
  };
}

export function* keepAlive(ops: OpFn[]) {
  return yield* all(ops.map(supervise));
}
