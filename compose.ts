import { call } from "./fx/index.ts";
import type { Instruction, Operation, Result } from "./deps.ts";
import { Err, Ok } from "./deps.ts";
import type { Next } from "./query/index.ts";

// deno-lint-ignore no-explicit-any
export type BaseCtx = Record<string, any>;
export type BaseMiddleware<Ctx extends BaseCtx = BaseCtx, T = unknown> = (
  ctx: Ctx,
  next: Next,
) => Operation<T>;

export function compose<Ctx extends BaseCtx = BaseCtx, T = unknown>(
  middleware: BaseMiddleware<Ctx, T>[],
) {
  if (!Array.isArray(middleware)) {
    throw new TypeError("Middleware stack must be an array!");
  }

  for (const fn of middleware) {
    if (typeof fn !== "function") {
      throw new TypeError("Middleware must be composed of functions!");
    }
  }

  return function* composeFn(context: Ctx, next?: BaseMiddleware<Ctx, T>) {
    // last called middleware #
    let index = -1;

    function* dispatch(i: number): Generator<Instruction, Result<T>, void> {
      if (i <= index) {
        return Err(new Error("next() called multiple times"));
      }
      index = i;
      let fn: BaseMiddleware<Ctx, T> | undefined = middleware[i];
      if (i === middleware.length) {
        fn = next;
      }
      if (!fn) return Err(new Error("fn is falsy"));
      const nxt = dispatch.bind(null, i + 1);
      const result = yield* fn(context, nxt);
      return Ok(result);
    }

    yield* call(() => dispatch(0));
    return context;
  };
}
