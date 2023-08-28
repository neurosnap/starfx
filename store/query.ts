import { race } from "../fx/mod.ts";
import { sleep } from "../deps.ts";
import type { ApiCtx, LoaderCtx, Next } from "../query/mod.ts";
import { compose } from "../compose.ts";
import type { QueryState, AnyAction } from "../types.ts";
import { createAction } from "../action.ts";

import { put, select, take, updateStore } from "./fx.ts";
import {
  addData,
  resetLoaderById,
  selectDataById,
  setLoaderError,
  setLoaderStart,
  setLoaderSuccess,
} from "./slice.ts";

export function storeMdw<Ctx extends ApiCtx = ApiCtx>(
  errorFn?: (ctx: Ctx) => string,
) {
  return compose<Ctx>([dispatchActions, loadingMonitor(errorFn), simpleCache]);
}

/**
 * This middleware will automatically cache any data found inside `ctx.json`
 * which is where we store JSON data from the `fetcher` middleware.
 */
export function* simpleCache<Ctx extends ApiCtx = ApiCtx>(
  ctx: Ctx,
  next: Next,
) {
  ctx.cacheData = yield* select((state: QueryState) =>
    selectDataById(state, { id: ctx.key })
  );
  yield* next();
  if (!ctx.cache) return;
  const { data } = ctx.json;
  yield* updateStore(addData({ [ctx.key]: data }));
  ctx.cacheData = data;
}

/**
 * This middleware will take the result of `ctx.actions` and dispatch them
 * as a single batch.
 *
 * @remarks This is useful because sometimes there are a lot of actions that need dispatched
 * within the pipeline of the middleware and instead of dispatching them serially this
 * improves performance by only hitting the reducers once.
 */
export function* dispatchActions(ctx: { actions: AnyAction[] }, next: Next) {
  if (!ctx.actions) ctx.actions = [];
  yield* next();
  if (ctx.actions.length === 0) return;
  yield* put(ctx.actions);
}

export interface OptimisticCtx<
  A extends AnyAction = AnyAction,
  R extends AnyAction = AnyAction,
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
export function* optimistic<Ctx extends OptimisticCtx = OptimisticCtx>(
  ctx: Ctx,
  next: Next,
) {
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

/**
 * This middleware creates a loader for a generator function which allows us to track
 * the status of a pipeline function.
 */
export function* loadingMonitorSimple<Ctx extends LoaderCtx = LoaderCtx>(
  ctx: Ctx,
  next: Next,
) {
  yield* updateStore([
    setLoaderStart({ id: ctx.name }),
    setLoaderStart({ id: ctx.key }),
  ]);

  if (!ctx.loader) {
    ctx.loader = {};
  }

  yield* next();

  yield* updateStore([
    setLoaderSuccess({ ...ctx.loader, id: ctx.name }),
    setLoaderSuccess({ ...ctx.loader, id: ctx.key }),
  ]);
}

/**
 * This middleware will track the status of a fetch request.
 */
export function loadingMonitor<Ctx extends ApiCtx = ApiCtx>(
  errorFn: (ctx: Ctx) => string = (ctx) => ctx.json?.data?.message || "",
) {
  return function* trackLoading(ctx: Ctx, next: Next) {
    yield* updateStore([
      setLoaderStart({ id: ctx.name }),
      setLoaderStart({ id: ctx.key }),
    ]);
    if (!ctx.loader) ctx.loader = {} as any;

    yield* next();

    if (!ctx.response) {
      yield* updateStore([
        resetLoaderById({ id: ctx.name }),
        resetLoaderById({ id: ctx.key }),
      ]);
      return;
    }

    if (!ctx.loader) {
      ctx.loader || {};
    }

    if (!ctx.response.ok) {
      yield* updateStore([
        setLoaderError({ id: ctx.name, message: errorFn(ctx), ...ctx.loader }),
        setLoaderError({ id: ctx.key, message: errorFn(ctx), ...ctx.loader }),
      ]);
      return;
    }

    yield* updateStore([
      setLoaderSuccess({ id: ctx.name, ...ctx.loader }),
      setLoaderSuccess({ id: ctx.key, ...ctx.loader }),
    ]);
  };
}
