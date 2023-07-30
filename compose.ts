import { call } from "./fx/mod.ts";
import type { Next } from "./query/mod.ts";
import { Err, Instruction, Operation, Result } from "./deps.ts";
import { resultAll } from "./result.ts";

// deno-lint-ignore no-explicit-any
export interface BaseCtx<T extends any[] = any[]> {
  // deno-lint-ignore no-explicit-any
  [key: string]: any;
  result: Result<T>;
}

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

  return function* composeFn(context: Ctx, mdw?: BaseMiddleware<Ctx, T>) {
    // deno-lint-ignore no-explicit-any
    const results: Result<any>[] = [];
    // last called middleware #
    let index = -1;

    function* dispatch(i: number): Generator<Instruction, void, void> {
      if (i <= index) {
        results.push(Err(new Error("next() called multiple times")));
        return;
      }
      index = i;
      let fn: BaseMiddleware<Ctx, T> | undefined = middleware[i];
      if (i === middleware.length) {
        fn = mdw;
      }
      if (!fn) {
        return;
      }
      const nxt = dispatch.bind(null, i + 1);
      const result = yield* call(() => {
        if (!fn) return;
        // deno-lint-ignore no-explicit-any
        return fn(context, nxt) as any;
      });
      results.push(result);
      context.result = resultAll(results);
    }

    yield* dispatch(0);
  };
}
