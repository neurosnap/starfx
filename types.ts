import type { Instruction, Operation } from "./deps.ts";

export interface Computation<T = unknown> {
  // deno-lint-ignore no-explicit-any
  [Symbol.iterator](): Iterator<Instruction, T, any>;
}

export type OpFn<T = unknown> =
  | (() => Operation<T>)
  | (() => PromiseLike<T>)
  | (() => T);
