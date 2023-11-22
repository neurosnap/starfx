import { compose } from "../compose.ts";
import type { Operator, Payload } from "../types.ts";
import { keepAlive } from "../mod.ts";

// TODO: remove store deps
import { takeEvery } from "../redux/mod.ts";

import { isFn, isObject } from "./util.ts";
import { createKey } from "./create-key.ts";
import type {
  ActionWithPayload,
  CreateAction,
  CreateActionPayload,
  CreateActionWithPayload,
  Middleware,
  MiddlewareCo,
  Next,
  PipeCtx,
  Supervisor,
} from "./types.ts";
import { API_ACTION_PREFIX } from "../action.ts";
import { Ok } from "../deps.ts";

export interface SagaApi<Ctx extends PipeCtx> {
  use: (fn: Middleware<Ctx>) => void;
  routes: () => Middleware<Ctx>;
  bootup: Operator<void>;

  /**
   * Name only
   */
  create(name: string): CreateAction<Ctx>;
  create<P>(
    name: string,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;

  /**
   * Name and options
   */
  create(name: string, req: { supervisor?: Supervisor }): CreateAction<Ctx>;
  create<P>(
    name: string,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;

  /**
   * Name and middleware
   */
  create(name: string, fn: MiddlewareCo<Ctx>): CreateAction<Ctx>;
  create<Gtx extends Ctx = Ctx>(
    name: string,
    fn: MiddlewareCo<Gtx>,
  ): CreateAction<Gtx>;
  create<P>(
    name: string,
    fn: MiddlewareCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  create<P, Gtx extends Ctx = Ctx>(
    name: string,
    fn: MiddlewareCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;

  /*
   * Name, options, and middleware
   */
  create(
    name: string,
    req: { supervisor?: Supervisor },
    fn: MiddlewareCo<Ctx>,
  ): CreateAction<Ctx>;
  create<Gtx extends Ctx = Ctx>(
    name: string,
    req: { supervisor?: Supervisor },
    fn: MiddlewareCo<Gtx>,
  ): CreateAction<Gtx>;
  create<P>(
    name: string,
    req: { supervisor?: Supervisor },
    fn: MiddlewareCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  create<P, Gtx extends Ctx = Ctx>(
    name: string,
    req: { supervisor?: Supervisor },
    fn: MiddlewareCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
}

/**
 * Creates a middleware pipeline.
 *
 * @remarks
 * This middleware pipeline is almost exactly like koa's middleware system.
 * See {@link https://koajs.com}
 *
 * @example
 * ```ts
 * import { createThunks } from 'starfx';
 *
 * const thunks = createThunks();
 * thunks.use(function* (ctx, next) {
 *   console.log('beginning');
 *   yield* next();
 *   console.log('end');
 * });
 * thunks.use(thunks.routes());
 *
 * const doit = thunks.create('do-something', function*(ctx, next) {
 *   console.log('middle');
 *   yield* next();
 *   console.log('middle end');
 * });
 *
 * // ...
 *
 * store.dispatch(doit());
 * // beginning
 * // middle
 * // middle end
 * // end
 * ```
 */
export function createThunks<Ctx extends PipeCtx = PipeCtx<any>>(
  {
    supervisor = takeEvery,
  }: {
    supervisor?: Supervisor;
  } = { supervisor: takeEvery },
): SagaApi<Ctx> {
  const middleware: Middleware<Ctx>[] = [];
  const visors: { [key: string]: Operator<unknown> } = {};
  const middlewareMap: { [key: string]: Middleware<Ctx> } = {};
  const actionMap: {
    [key: string]: CreateActionWithPayload<Ctx, any>;
  } = {};

  function* defaultMiddleware(_: Ctx, next: Next) {
    yield* next();
  }

  const createType = (post: string) =>
    `${API_ACTION_PREFIX}${post.startsWith("/") ? "" : "/"}${post}`;

  function* onApi<P extends CreateActionPayload>(action: ActionWithPayload<P>) {
    const { name, key, options } = action.payload;
    const actionFn = actionMap[name];
    const ctx = {
      action,
      name,
      key,
      payload: options,
      actionFn,
      result: Ok(undefined),
    } as unknown as Ctx;
    const fn = compose(middleware);
    yield* fn(ctx);
    return ctx;
  }

  function create(name: string, ...args: any[]) {
    const type = createType(name);
    const action = (payload?: any) => {
      return { type, payload };
    };
    let req = null;
    let fn = null;
    if (args.length === 2) {
      req = args[0];
      fn = args[1];
    }

    if (args.length === 1) {
      if (isFn(args[0]) || Array.isArray(args[0])) {
        fn = args[0];
      } else {
        req = args[0];
      }
    }

    if (req && !isObject(req)) {
      throw new Error("Options must be an object");
    }

    if (fn && Array.isArray(fn)) {
      fn = compose(fn);
    }

    if (fn && !isFn(fn)) {
      throw new Error("Middleware must be a function");
    }

    if (middlewareMap[name]) {
      console.warn(
        `[${name}] already exists which means you have two functions with the same name`,
      );
    }

    middlewareMap[name] = fn || defaultMiddleware;

    const tt = req ? (req as any).supervisor : supervisor;
    function* curVisor() {
      const task = yield* tt(type, onApi);
      yield* task;
    }
    visors[name] = curVisor;

    const actionFn = (options?: Ctx["payload"]) => {
      const key = createKey(name, options);
      return action({ name, key, options });
    };
    actionFn.run = onApi;
    actionFn.toString = () => name;
    actionMap[name] = actionFn;

    return actionFn;
  }

  function* bootup() {
    yield* keepAlive(Object.values(visors));
  }

  function routes() {
    function* router(ctx: Ctx, next: Next) {
      const match = middlewareMap[ctx.name];
      if (!match) {
        yield* next();
        return;
      }

      const result = yield* match(ctx, next);
      return result;
    }

    return router;
  }

  return {
    use: (fn: Middleware<Ctx>) => {
      middleware.push(fn);
    },
    create,
    routes,
    bootup,
  };
}
