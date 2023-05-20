import { call, race } from "../fx/index.ts";
import { put, select, take } from "../redux/index.ts";
import { batchActions, sleep } from "../deps.ts";
import { compose } from "../compose.ts";
import type { OpFn } from "../types.ts";

import type {
  Action,
  ApiCtx,
  ApiRequest,
  LoaderCtx,
  Next,
  PipeCtx,
  RequiredApiRequest,
} from "./types.ts";
import { createAction, isObject, mergeRequest } from "./util.ts";
import {
  addData,
  resetLoaderById,
  selectDataById,
  setLoaderError,
  setLoaderStart,
  setLoaderSuccess,
} from "./slice.ts";

/**
 * This middleware will catch any errors in the pipeline
 * and return the context object.
 */
export function* errorHandler<Ctx extends PipeCtx = PipeCtx>(
  ctx: Ctx,
  next: Next,
) {
  try {
    yield* next();
  } catch (err) {
    console.error(
      `Error: ${err.message}.  Check the endpoint [${ctx.name}]`,
      ctx,
    );
    throw err;
  }
}

/**
 * This middleware sets up the context object with some values that are
 * necessary for {@link createApi} to work properly.
 */
export function* queryCtx<Ctx extends ApiCtx = ApiCtx>(ctx: Ctx, next: Next) {
  if (!ctx.req) {
    ctx.req = (r?: ApiRequest): RequiredApiRequest =>
      mergeRequest(ctx.request, r);
  }
  if (!ctx.request) ctx.request = ctx.req();
  if (!ctx.response) ctx.response = null;
  if (!ctx.json) ctx.json = { ok: false, data: {} };
  if (!ctx.actions) ctx.actions = [];
  if (!ctx.bodyType) ctx.bodyType = "json";
  yield* next();
}

/**
 * This middleware converts the name provided to {@link createApi} into data for the fetch request.
 */
export function* urlParser<Ctx extends ApiCtx = ApiCtx>(ctx: Ctx, next: Next) {
  const httpMethods = [
    "get",
    "head",
    "post",
    "put",
    "delete",
    "connect",
    "options",
    "trace",
    "patch",
  ];

  const options = ctx.payload || {};
  if (!isObject(options)) {
    yield* next();
    return;
  }

  let url = Object.keys(options).reduce((acc, key) => {
    return acc.replace(`:${key}`, options[key]);
  }, ctx.name);

  let method = "";
  httpMethods.forEach((curMethod) => {
    const pattern = new RegExp(`\\s*\\[` + curMethod + `\\]\\s*\\w*`, "i");
    const tmpUrl = url.replace(pattern, "");
    if (tmpUrl.length !== url.length) {
      method = curMethod.toLocaleUpperCase();
    }
    url = tmpUrl;
  }, url);

  ctx.request = ctx.req({ url });
  if (method) {
    ctx.request = ctx.req({ method });
  }

  yield* next();
}

/**
 * This middleware will take the result of `ctx.actions` and dispatch them
 * as a single batch.
 *
 * @remarks This is useful because sometimes there are a lot of actions that need dispatched
 * within the pipeline of the middleware and instead of dispatching them serially this
 * improves performance by only hitting the reducers once.
 */
export function* dispatchActions(ctx: { actions: Action[] }, next: Next) {
  if (!ctx.actions) ctx.actions = [];
  yield* next();
  if (ctx.actions.length === 0) return;
  yield* put(batchActions(ctx.actions));
}

/**
 * This middleware creates a loader for a generator function which allows us to track
 * the status of a pipeline function.
 */
export function* loadingMonitorSimple<Ctx extends LoaderCtx = LoaderCtx>(
  ctx: Ctx,
  next: Next,
) {
  yield* put(
    batchActions([
      setLoaderStart({ id: ctx.name }),
      setLoaderStart({ id: ctx.key }),
    ]),
  );
  if (!ctx.loader) ctx.loader = {} as any;

  yield* next();

  const payload = ctx.loader || {};
  yield* put(
    batchActions([
      setLoaderSuccess({ id: ctx.name, ...payload }),
      setLoaderSuccess({ id: ctx.key, ...payload }),
    ]),
  );
}

/**
 * This middleware will track the status of a fetch request.
 */
export function loadingMonitor<Ctx extends ApiCtx = ApiCtx>(
  errorFn: (ctx: Ctx) => string = (ctx) => ctx.json?.data?.message || "",
) {
  return function* trackLoading(ctx: Ctx, next: Next) {
    yield* put(
      batchActions([
        setLoaderStart({ id: ctx.name }),
        setLoaderStart({ id: ctx.key }),
      ]),
    );
    if (!ctx.loader) ctx.loader = {} as any;

    yield* next();

    if (!ctx.response) {
      ctx.actions.push(resetLoaderById(ctx.name), resetLoaderById(ctx.key));
      return;
    }

    const payload = ctx.loader || {};
    if (!ctx.response.ok) {
      ctx.actions.push(
        setLoaderError({ id: ctx.name, message: errorFn(ctx), ...payload }),
        setLoaderError({ id: ctx.key, message: errorFn(ctx), ...payload }),
      );
      return;
    }

    ctx.actions.push(
      setLoaderSuccess({ id: ctx.name, ...payload }),
      setLoaderSuccess({ id: ctx.key, ...payload }),
    );
  };
}

export interface UndoCtx<P = any, S = any, E = any> extends ApiCtx<P, S, E> {
  undoable: boolean;
}

export const doIt = createAction("DO_IT");
export const undo = createAction("UNDO");
/**
 * This middleware will allow pipeline functions to be undoable which means before they are activated
 * we have a timeout that allows the function to be cancelled.
 */
export function undoer<Ctx extends UndoCtx = UndoCtx>(
  doItType = `${doIt}`,
  undoType = `${undo}`,
  timeout = 30 * 1000,
) {
  return function* onUndo(ctx: Ctx, next: Next) {
    if (!ctx.undoable) {
      yield* next();
      return;
    }

    const winner = yield* race({
      doIt: () => take(`${doItType}`),
      undo: () => take(`${undoType}`),
      timeout: () => sleep(timeout),
    });

    if (winner.undo || winner.timeout) {
      return;
    }

    yield* next();
  };
}

export interface OptimisticCtx<
  A extends Action = Action,
  R extends Action = Action,
> extends ApiCtx {
  optimistic: {
    apply: A;
    revert: R;
  };
}

/**
 * This middleware performs an optimistic update for a middleware pipeline.
 * It accepts an `apply` and `revert` action.
 *
 * @remarks This means that we will first `apply` and then if the request is successful we
 * keep the change or we `revert` if there's an error.
 */
export function* optimistic<
  Ctx extends OptimisticCtx = OptimisticCtx,
>(ctx: Ctx, next: Next) {
  if (!ctx.optimistic) {
    yield* next();
    return;
  }

  const { apply, revert } = ctx.optimistic;
  // optimistically update user
  yield* put(apply);

  yield* next();

  if (!ctx.response || !ctx.response.ok) {
    yield* put(revert);
  }
}

/**
 * This middleware will automatically cache any data found inside `ctx.json`
 * which is where we store JSON data from the `fetcher` middleware.
 */
export function* simpleCache<Ctx extends ApiCtx = ApiCtx>(
  ctx: Ctx,
  next: Next,
) {
  ctx.cacheData = yield* select((state) =>
    selectDataById(state, { id: ctx.key })
  );
  yield* next();
  if (!ctx.cache) return;
  const { data } = ctx.json;
  ctx.actions.push(addData({ [ctx.key]: data }));
  ctx.cacheData = data;
}

/**
 * This middleware allows the user to override the default key provided to every pipeline function
 * and instead use whatever they want.
 *
 * @example
 * ```ts
 * import { createPipe } from 'saga-query';
 *
 * const thunk = createPipe();
 * thunk.use(customKey);
 *
 * const doit = thunk.create('some-action', function*(ctx, next) {
 *   ctx.key = 'something-i-want';
 * })
 * ```
 */
export function* customKey<Ctx extends ApiCtx = ApiCtx>(ctx: Ctx, next: Next) {
  if (
    ctx?.key &&
    ctx?.action?.payload?.key &&
    ctx.key !== ctx.action.payload.key
  ) {
    const newKey = ctx.name.split("|")[0] + "|" + ctx.key;
    ctx.key = newKey;
    ctx.action.payload.key = newKey;
  }
  yield* next();
}

/**
 * This middleware is a composition of many middleware used to faciliate the {@link createApi}
 */
export function requestMonitor<Ctx extends ApiCtx = ApiCtx>(
  errorFn?: (ctx: Ctx) => string,
) {
  return compose<Ctx>([
    errorHandler,
    queryCtx,
    urlParser,
    dispatchActions,
    loadingMonitor(errorFn),
    simpleCache,
    customKey,
  ]);
}

export interface PerfCtx<P = unknown> extends PipeCtx<P> {
  performance: number;
}

/**
 * This middleware will add `performance.now()` before and after your middleware pipeline.
 */
export function* performanceMonitor<Ctx extends PerfCtx = PerfCtx>(
  ctx: Ctx,
  next: Next,
) {
  const t0 = performance.now();
  yield* next();
  const t1 = performance.now();
  ctx.performance = t1 - t0;
}

/**
 * This middleware will call the `saga` provided with the action sent to the middleware pipeline.
 */
export function wrap<Ctx extends PipeCtx = PipeCtx>(
  op: (a: Action) => OpFn,
) {
  return function* (ctx: Ctx, next: Next) {
    yield* call(() => op(ctx.action));
    yield* next();
  };
}
