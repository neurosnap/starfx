import type { OpFn } from "../types.ts";
import type { Operation, Result } from "../deps.ts";
import { action, Err, expect, Ok } from "../deps.ts";

export const isFunc = (f: unknown) => typeof f === "function";
export const isPromise = (p: unknown) =>
  p && isFunc((p as PromiseLike<unknown>).then);
export const isIterator = (it: unknown) =>
  it &&
  isFunc((it as Iterator<unknown>).next) &&
  isFunc((it as Iterator<unknown>).throw);

export function* toOp<T>(opFn: OpFn<T>): Operation<T> {
  const op = opFn();
  let result: T;
  if (isPromise(op)) {
    result = yield* expect(op as Promise<T>);
  } else if (isIterator(op)) {
    result = yield* op as Operation<T>;
  } else {
    result = op as T;
  }
  return result;
}

export function call<T>(op: OpFn<T>): Operation<T> {
  return action(function* (resolve) {
    const result = yield* toOp(op);
    resolve(result);
  });
}

export function* safe<T>(opFn: OpFn<T>): Operation<Result<T>> {
  try {
    const value = yield* call(opFn);
    return Ok(value);
  } catch (error) {
    return Err(error);
  }
}
