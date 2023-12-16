import type { Callable, Operation, Result } from "../deps.ts";
import { call, Err, Ok } from "../deps.ts";

export function* safe<T>(operator: Callable<T>): Operation<Result<T>> {
  try {
    const value = yield* call<T>(operator as any);
    return Ok(value);
  } catch (error) {
    return Err(error);
  }
}
