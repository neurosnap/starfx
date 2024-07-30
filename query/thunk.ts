import { compose } from "../compose.ts";
import type { ActionWithPayload, AnyAction, Next, Payload } from "../types.ts";
import { ActionContext, createAction, put, takeEvery } from "../action.ts";
import { isFn, isObject } from "./util.ts";
import { createKey } from "./create-key.ts";
import type {
  CreateAction,
  CreateActionPayload,
  CreateActionWithPayload,
  Middleware,
  MiddlewareCo,
  Supervisor,
  ThunkCtx,
} from "./types.ts";
import { API_ACTION_PREFIX } from "../action.ts";
import { Callable, Ok, Operation, Signal, spawn } from "../deps.ts";
import { supervise } from "../fx/mod.ts";

const registerThunk = createAction<Callable<unknown>>(
  `${API_ACTION_PREFIX}REGISTER_THUNK`,
);

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
  const middleware: Middleware<Ctx>[] = [];
  const visors: { [key: string]: Callable<unknown> } = {};
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
      yield* tt(type, onApi);
    }
    // if we have a signal that means the `register()` function has already been called
    // so that means we can immediately register the thunk
    if (signal) {
      signal.send(registerThunk(curVisor));
    }
    visors[name] = curVisor;

    const errMsg =
      `[${name}] is being called before its thunk has been registered. ` +
      "Run `store.run(thunks.register)` where `thunks` is the name of your `createThunks` or `createApi` variable.";

    const actionFn = (options?: Ctx["payload"]) => {
      if (!signal) {
        console.error(errMsg);
      }
      const key = createKey(name, options);
      return action({ name, key, options });
    };
    actionFn.run = (action?: unknown): Operation<Ctx> => {
      if (!signal) {
        console.error(errMsg);
      }
      if (action && Object.hasOwn(action, "type")) {
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
    // cache the signal so we can use it when creating thunks after we
    // have already called `register()`
    signal = yield* ActionContext;

    const task = yield* spawn(function* () {
      yield* takeEvery(`${registerThunk}`, watcher as any);
    });

    // register any thunks already created
    yield* put(Object.values(visors).map(registerThunk));

    yield* task;
  }

  function* bootup() {
    yield* register();
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
    bootup,
    reset: resetMdw,
    register,
  };
}
