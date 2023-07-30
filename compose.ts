import { call } from "./fx/mod.ts";
import type { Next } from "./query/mod.ts";
import { Instruction, Operation, Result } from "./deps.ts";

export interface BaseCtx {
  // deno-lint-ignore no-explicit-any
  [key: string]: any;
  result: Result<void>;
}

export type BaseMiddleware<Ctx extends BaseCtx = BaseCtx, T = unknown> = (
  ctx: Ctx,
  next: Next,
) => Operation<T | undefined>;

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
    // last called middleware #
    let index = -1;

    function* dispatch(i: number): Generator<Instruction, void, void> {
      if (i <= index) {
        throw new Error("next() called multiple times");
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
      const result = yield* call(function* () {
        if (!fn) return;
        return yield* fn(context, nxt);
      });
      if (!result.ok && context.result.ok) {
        context.result = result;
      }
    }

    const result = yield* call(() => dispatch(0));
    if (context.result.ok) {
      context.result = result;
    }
  };
}
