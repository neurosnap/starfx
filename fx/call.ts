import type { Operation, Task } from "../deps.ts";
import { action, expect, spawn } from "../deps.ts";
import type { OpFn } from "../types.ts";
import { ErrContext } from "../context.ts";

export interface ResultOk<T> {
  type: "ok";
  ok: true;
  value: T;
}

export interface ResultErr {
  type: "err";
  ok: false;
  error: Error;
}

export type Result<T> = ResultOk<T> | ResultErr;

export function Ok<T>(value: T): ResultOk<T> {
  return {
    type: "ok",
    ok: true,
    value,
  };
}

export function Err(error: Error): ResultErr {
  return {
    type: "err",
    ok: false,
    error,
  };
}

export const isFunc = (f: unknown) => typeof f === "function";
export const isPromise = (p: unknown) =>
  p && isFunc((p as PromiseLike<unknown>).then);
export const isIterator = (it: unknown) =>
  it &&
  isFunc((it as Iterator<unknown>).next) &&
  isFunc((it as Iterator<unknown>).throw);

export function* toOperation<T>(opFn: OpFn<T>): Operation<T> {
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
    const result = yield* toOperation(op);
    resolve(result);
  });
}

export function* go<T>(op: OpFn<T>): Operation<Task<Result<T>>> {
  return yield* spawn(function* () {
    try {
      return Ok(yield* call(op));
    } catch (error) {
      const { input } = yield* ErrContext;
      yield* input.send(error);
      return Err(error);
    }
  });
}

export function* safe<T>(opFn: OpFn<T>): Operation<Result<T>> {
  try {
    const value = yield* call(opFn);
    return Ok(value);
  } catch (error) {
    const { input } = yield* ErrContext;
    yield* input.send(error);
    return Err(error);
  }
}
