import { createLoaderTable, createReducerMap, createTable } from "../deps.ts";
import { compose } from "../compose.ts";
export { defaultLoader } from "../store/mod.ts";
import type { AnyAction } from "../store/mod.ts";
import { ApiCtx, createKey, Next } from "../query/mod.ts";
import { put, select } from "./mod.ts";
import type { QueryState } from "../types.ts";

export function reduxMdw<Ctx extends ApiCtx = ApiCtx>(
  errorFn?: (ctx: Ctx) => string,
) {
  return compose<Ctx>([dispatchActions, loadingMonitor(errorFn), simpleCache]);
}

export const LOADERS_NAME = "@@starfx/loaders";
export const loaders = createLoaderTable({ name: LOADERS_NAME });
export const {
  loading: setLoaderStart,
  error: setLoaderError,
  success: setLoaderSuccess,
  resetById: resetLoaderById,
} = loaders.actions;
export const { selectTable: selectLoaders, selectById: selectLoaderById } =
  loaders.getSelectors((state: any) => state[LOADERS_NAME] || {});

export const DATA_NAME = "@@starfx/data";
export const data = createTable<any>({ name: DATA_NAME });
export const { add: addData, reset: resetData } = data.actions;

export const { selectTable: selectData, selectById: selectDataById } = data
  .getSelectors((s: any) => s[DATA_NAME] || {});

/**
 * Returns data from the saga-query slice of redux from an action.
 */
export const selectDataByName = (
  s: any,
  p: { name: string; payload?: any },
) => {
  const id = createKey(p.name, p.payload);
  const data = selectDataById(s, { id });
  return data;
};

export const reducers = createReducerMap(loaders, data);

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
  if (!ctx.json.ok) return;
  const data = ctx.json.value;
  yield* put(addData({ [ctx.key]: data }));
  ctx.cacheData = data;
}

/**
 * This middleware will track the status of a fetch request.
 */
export function loadingMonitor<Ctx extends ApiCtx = ApiCtx>(
  errorFn: (ctx: Ctx) => string = (ctx) => {
    if (ctx.json.ok) return "";
    return ctx.json.error.message;
  },
) {
  return function* trackLoading(ctx: Ctx, next: Next) {
    yield* put([
      setLoaderStart({ id: ctx.name }),
      setLoaderStart({ id: ctx.key }),
    ]);
    if (!ctx.loader) ctx.loader = {} as any;

    yield* next();

    if (!ctx.response) {
      yield* put([
        resetLoaderById(ctx.name),
        resetLoaderById(ctx.key),
      ]);
      return;
    }

    if (!ctx.loader) {
      ctx.loader || {};
    }

    if (!ctx.response.ok) {
      yield* put([
        setLoaderError({
          id: ctx.name as any,
          message: errorFn(ctx),
          ...ctx.loader,
        }),
        setLoaderError({
          id: ctx.key as any,
          message: errorFn(ctx),
          ...ctx.loader,
        }),
      ]);
      return;
    }

    yield* put([
      setLoaderSuccess({ id: ctx.name as any, ...ctx.loader }),
      setLoaderSuccess({ id: ctx.key as any, ...ctx.loader }),
    ]);
  };
}
