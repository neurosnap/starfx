import { call } from "./fx/mod.ts";
import type { Instruction, Result } from "./deps.ts";
import { Err } from "./deps.ts";

export type MdwCtx = Record<string, any>;

export type Next<T = unknown> = () => Generator<Instruction, Result<T>, void>;
export type Middleware<Ctx extends MdwCtx = MdwCtx> = (
  ctx: Ctx,
  next: Next,
) => any;
/* type MiddlewareCo<Ctx extends MdwCtx = MdwCtx> =
  | Middleware<Ctx>
  | Middleware<Ctx>[]; */

export function compose<Ctx extends MdwCtx = MdwCtx>(
  middleware: Middleware<Ctx>[],
) {
  if (!Array.isArray(middleware)) {
    throw new TypeError("Middleware stack must be an array!");
  }

  for (const fn of middleware) {
    if (typeof fn !== "function") {
      throw new TypeError("Middleware must be composed of functions!");
    }
  }

  return function* composeFn<T>(context: Ctx, next?: Next) {
    // last called middleware #
    let index = -1;

    function* dispatch(i: number): Generator<Instruction, Result<T>, void> {
      if (i <= index) {
        return Err(new Error("next() called multiple times"));
      }
      index = i;
      let fn: any = middleware[i];
      if (i === middleware.length) fn = next;
      if (!fn) return Err(new Error("fn is falsy"));
      const nxt = dispatch.bind(null, i + 1);
      const result = yield* fn(context, nxt);
      return result;
    }

    yield* call(() => dispatch(0));
    return context;
  };
}
