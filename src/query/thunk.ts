import {
  type Callable,
  Ok,
  type Operation,
  type Signal,
  ensure,
} from "effection";
import { API_ACTION_PREFIX, ActionContext, takeEvery } from "../action.js";
import { compose } from "../compose.js";
import { keepAlive, supervise } from "../fx/mod.js";
import { IdContext } from "../store/store.js";
import { createKey } from "./create-key.js";
import { isFn, isObject } from "./util.js";

import type { ActionWithPayload, AnyAction, Next, Payload } from "../types.js";
import type {
  CreateAction,
  CreateActionPayload,
  CreateActionWithPayload,
  Middleware,
  MiddlewareCo,
  Supervisor,
  ThunkCtx,
} from "./types.js";
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
    supervisor = takeEvery,
  }: {
    supervisor?: Supervisor;
  } = { supervisor: takeEvery },
): ThunksApi<Ctx> {
  let signal: Signal<AnyAction, void> | undefined = undefined;
  let storeId: number | undefined = undefined;
  const middleware: Middleware<Ctx>[] = [];
  const visors: { [key: string]: Callable<unknown> } = {};
  const middlewareMap: { [key: string]: Middleware<Ctx> } = {};
  let dynamicMiddlewareMap: { [key: string]: Middleware<Ctx> } = {};
  const actionMap: {
    [key: string]: CreateActionWithPayload<Ctx, any>;
  } = {};
  const thunkId = id++;

  const storeMap = new Map<number, Signal<AnyAction, void>>();

  function* defaultMiddleware(_: Ctx, next: Next) {
    yield* next();
  }

  const createType = (post: string) => `${API_ACTION_PREFIX}${post}`;

  function* onApi<P extends CreateActionPayload>(
    action: ActionWithPayload<P>,
  ): Operation<Ctx> {
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
    if (visors[name]) {
      const msg = `[${name}] already exists, do you have two thunks with the same name?`;
      console.warn(msg);
    }

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
      yield* tt(type, onApi);
    }

    visors[name] = curVisor;

    // If signal is already referenced, register immediately, otherwise defer
    for (const [storeId, storeSignal] of storeMap.entries()) {
      storeSignal.send({
        type: `${API_ACTION_PREFIX}REGISTER_THUNK_${storeId}_${thunkId}`,
        payload: curVisor,
      });
    }

    const errMsg = `[${name}] is being called before its thunk has been registered. Run \`store.run(thunks.register)\` where \`thunks\` is the name of your \`createThunks\` or \`createApi\` variable.`;

    const actionFn = (options?: Ctx["payload"]) => {
      if (!signal) {
        console.warn(errMsg);
      }
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

  function* watcher(action: ActionWithPayload<Callable<unknown>>) {
    yield* supervise(action.payload)();
  }

  function* register() {
    storeId = yield* IdContext;
    if (storeId && storeMap.has(storeId)) {
      console.warn("This thunk instance is already registered.");
      return;
    }

    signal = yield* ActionContext;
    storeMap.set(storeId, signal);

    yield* ensure(function* () {
      if (storeId) {
        storeMap.delete(storeId);
      }
    });

    // Register any thunks created after signal is available
    yield* keepAlive(Object.values(visors));

    // Spawn a watcher for further thunk matchingPairs
    yield* takeEvery(
      `${API_ACTION_PREFIX}REGISTER_THUNK_${storeId}_${thunkId}`,
      watcher as any,
    );
  }

  function routes() {
    function* router(ctx: Ctx, next: Next) {
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
