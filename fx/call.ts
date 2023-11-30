import type { Operation, Result } from "../deps.ts";
import { call, Err, Ok } from "../deps.ts";
import type { Operator } from "../types.ts";

export function* safe<T>(operator: Operator<T>): Operation<Result<T>> {
  try {
    const value: T = yield* call(operator as any) as any;
    return Ok(value);
  } catch (error) {
    return Err(error);
  }
}
