import type { Operation, Result } from "effection";
import { call, Err, Ok } from "effection";

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
export function* safe<T>(
  operatorFunction: Operation<T>,
): Operation<Result<T>> {
  try {
    const value = yield* call(() => operatorFunction);
    return Ok(value);
  } catch (error) {
    return Err(error as Error);
  }
}
