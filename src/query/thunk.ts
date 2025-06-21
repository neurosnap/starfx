import {
  type Callable,
  Ok,
  type Operation,
  ensure,
  createScope,
  createSignal,
  each,
  useScope,
} from "effection";
import { API_ACTION_PREFIX, takeEvery } from "../action.js";
import { compose } from "../compose.js";
import { supervise } from "../fx/index.js";
import { createKey } from "./create-key.js";
import { isFn, isObject } from "./util.js";

import type { ActionWithPayload, Next, Payload } from "../types.js";
import type {
  CreateAction,
  CreateActionPayload,
  CreateActionWithPayload,
  Middleware,
  MiddlewareCo,
  Supervisor,
  ThunkCtx,
} from "./types.js";
import { ThunksContext } from "../store/context.js";
export interface ThunksApi<Ctx extends ThunkCtx> {
  use: (fn: Middleware<Ctx>) => void;
  routes: () => Middleware<Ctx>;
  bootup: Callable<void>;
  register: Callable<void>;
  reset: () => void;

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

let id = 0;

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
export function createThunks<Ctx extends ThunkCtx = ThunkCtx<any>>(
  {
    thunkKey = (id++).toString(),
    supervisor = takeEvery,
  }: {
    thunkKey: string;
    supervisor?: Supervisor;
  } = { thunkKey: (id++).toString(), supervisor: takeEvery },
): ThunksApi<Ctx> {
  const watch = createSignal<Callable<unknown>>();
  const middleware: Middleware<Ctx>[] = [];
  const middlewareMap: { [key: string]: Middleware<Ctx> } = {};
  let dynamicMiddlewareMap: { [key: string]: Middleware<Ctx> } = {};
  const actionMap: {
    [key: string]: CreateActionWithPayload<Ctx, any>;
  } = {};

  function* defaultMiddleware(_: Ctx, next: Next) {
    yield* next();
  }

  const createType = (post: string) => `${API_ACTION_PREFIX}${post}`;

  function* onApi<P extends CreateActionPayload>(
    action: ActionWithPayload<P>,
  ): Operation<Ctx> {
    const { name, key, options } = action.payload;
    console.log({ action });
    const actionFn = actionMap[name];
    const ctx = {
      action,
      name,
      key,
      payload: options,
      actionFn,
      result: Ok(undefined),
    } as unknown as Ctx;
    console.log({ ctx });
    const fn = compose(middleware);
    console.log({ fn });
    yield* fn(ctx);
    return ctx;
  }

  function create(name: string, ...args: any[]) {
    const type = createType(name);
    const action = (payload?: any) => {
      return { type, payload };
    };
    let req = null;
    let fn: any = null;
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

    middlewareMap[name] = fn || defaultMiddleware;

    const tt = req ? (req as any).supervisor : supervisor;
    function* curVisor() {
      console.log("in curVisor");
      yield* tt(type, onApi);
    }
    watch.send(curVisor);

    const actionFn = (options?: Ctx["payload"]) => {
      const key = createKey(name, options);
      return action({ name, key, options });
    };
    actionFn.run = (action?: unknown): Operation<Ctx> => {
      if (action && (action as any).type) {
        return onApi(action as ActionWithPayload<CreateActionPayload>);
      }
      return onApi(actionFn(action));
    };
    actionFn.use = (fn: Middleware<Ctx>) => {
      const cur = middlewareMap[name];
      if (cur) {
        dynamicMiddlewareMap[name] = compose([cur, fn]);
      } else {
        dynamicMiddlewareMap[name] = fn;
      }
    };
    actionFn.toString = () => type;
    actionFn._success = {};
    actionFn._error = {};
    actionMap[name] = actionFn;

    return actionFn;
  }

  function* register() {
    const parent = yield* useScope();
    const existingThunks = parent.expect(ThunksContext);
    console.log({ existingThunks });
    if (existingThunks.includes(thunkKey)) {
      console.warn("wtf");
      return;
    }
    existingThunks.push(thunkKey);

    const [scope, destroy] = createScope(parent);

    yield* ensure(destroy);
    console.log("ensured", watch);

    try {
      // TODO don't think the thunks are landing here
      for (const thunked of yield* each(watch)) {
        // yield* supervise(thunked)();
        // is this thunking?
        console.log("thunked", thunked);
        yield* scope.spawn(supervise(thunked));
        yield* each.next();
      }
    } catch (error) {
      console.error(error);
    } finally {
      console.log("donzo");
    }
  }

  function routes() {
    function* router(ctx: Ctx, next: Next) {
      console.log("router", ctx);
      const match = dynamicMiddlewareMap[ctx.name] || middlewareMap[ctx.name];
      if (!match) {
        yield* next();
        return;
      }

      const result = yield* match(ctx, next);
      return result;
    }

    return router;
  }

  function resetMdw() {
    dynamicMiddlewareMap = {};
  }

  return {
    use: (fn: Middleware<Ctx>) => {
      middleware.push(fn);
    },
    create,
    routes,
    /**
     * @deprecated use `register()` instead
     */
    bootup: register,
    reset: resetMdw,
    register,
  };
}
