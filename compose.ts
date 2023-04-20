import { safe } from "./fx/mod.ts";

interface Middleware<Ctx> {}
type Next = () => void;
interface PipeCtx {}

export function compose<Ctx extends PipeCtx = PipeCtx>(
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

  return function* composeFn(context: Ctx, next?: Next): SagaIterator<void> {
    // last called middleware #
    let index = -1;
    yield* safe(() => dispatch(0));

    function* dispatch(i: number) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let fn: any = middleware[i];
      if (i === middleware.length) fn = next;
      if (!fn) return;
      yield* safe(() => fn(context, dispatch.bind(null, i + 1)));
    }
  };
}
