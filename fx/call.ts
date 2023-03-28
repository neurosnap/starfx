import type { Operation, Task } from "../deps.ts";
import { action, expect, spawn } from "../deps.ts";
import type { OpFn } from "../types.ts";
import { ErrContext } from "../context.ts";

export interface ResultOk<T> {
  type: "ok";
  value: T;
  isOk: true;
  isErr: false;
}

export interface ResultErr {
  type: "err";
  value: Error;
  isOk: false;
  isErr: true;
}

export type Result<T> = ResultOk<T> | ResultErr;

export function Ok<T>(value: T): ResultOk<T> {
  return {
    type: "ok",
    value,
    isOk: true,
    isErr: false,
  };
}

export function Err(value: Error): ResultErr {
  return {
    type: "err",
    value,
    isOk: false,
    isErr: true,
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
      let { input } = yield* ErrContext;
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
    let { input } = yield* ErrContext;
    yield* input.send(error);
    return Err(error);
  }
}
