import type { Callable, Operation, Result } from "../deps.ts";
import { call, Err, Ok } from "../deps.ts";

/**
 * The goal of `safe` is to wrap Operations to prevent them from raising
 * and error.  The result of `safe` is always a {@link Result} type.
 *
 * @example
 * ```ts
 * import { safe } from "starfx";
 *
 * function* run() {
 *  const results = yield* safe(fetch("api.com"));
 *  if (result.ok) {
 *    console.log(result.value);
 *  } else {
 *    console.error(result.error);
 *  }
 * }
 * ```
 */
export function* safe<T>(operator: Callable<T>): Operation<Result<T>> {
  try {
    const value = yield* call<T>(operator as any);
    return Ok(value);
  } catch (error) {
    return Err(error);
  }
}
