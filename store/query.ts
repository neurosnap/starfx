import type { ApiCtx, Next } from "../query/mod.ts";
import { compose } from "../compose.ts";
import type { AnyAction, AnyState } from "../types.ts";

import { put, select, updateStore } from "./fx.ts";
import { LoaderOutput } from "./slice/loader.ts";
import { TableOutput } from "./slice/table.ts";

export function storeMdw<
  Ctx extends ApiCtx = ApiCtx,
  M extends AnyState = AnyState,
>({ data, loaders, errorFn }: {
  loaders: LoaderOutput<M, AnyState>;
  data: TableOutput<any, AnyState>;
  errorFn?: (ctx: Ctx) => string;
}) {
  return compose<Ctx>([
    dispatchActions,
    loadingMonitor(loaders, errorFn),
    simpleCache(data),
  ]);
}

/**
 * This middleware will automatically cache any data found inside `ctx.json`
 * which is where we store JSON data from the {@link mdw.fetch} middleware.
 */
export function simpleCache<Ctx extends ApiCtx = ApiCtx>(
  dataSchema: TableOutput<any, AnyState>,
) {
  return function* (
    ctx: Ctx,
    next: Next,
  ) {
    ctx.cacheData = yield* select(dataSchema.selectById, { id: ctx.key });
    yield* next();
    if (!ctx.cache) return;
    let data;
    if (ctx.json.ok) {
      data = ctx.json.value;
    } else {
      data = ctx.json.error;
    }
    yield* updateStore(dataSchema.add({ [ctx.key]: data }));
    ctx.cacheData = data;
  };
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

/**
 * This middleware will track the status of a fetch request.
 */
export function loadingMonitor<
  Ctx extends ApiCtx = ApiCtx,
  M extends AnyState = AnyState,
>(
  loaderSchema: LoaderOutput<M, AnyState>,
  errorFn: (ctx: Ctx) => string = (ctx) => {
    const jso = ctx.json;
    if (jso.ok) return "";
    return jso.error?.message || "";
  },
) {
  return function* trackLoading(ctx: Ctx, next: Next) {
    yield* updateStore([
      loaderSchema.start({ id: ctx.name }),
      loaderSchema.start({ id: ctx.key }),
    ]);
    if (!ctx.loader) ctx.loader = {} as any;

    yield* next();

    if (!ctx.response) {
      yield* updateStore(
        loaderSchema.resetByIds([ctx.name, ctx.key]),
      );
      return;
    }

    if (!ctx.loader) {
      ctx.loader || {};
    }

    if (!ctx.response.ok) {
      yield* updateStore([
        loaderSchema.error({
          id: ctx.name,
          message: errorFn(ctx),
          ...ctx.loader,
        }),
        loaderSchema.error({
          id: ctx.key,
          message: errorFn(ctx),
          ...ctx.loader,
        }),
      ]);
      return;
    }

    yield* updateStore([
      loaderSchema.success({ id: ctx.name, ...ctx.loader }),
      loaderSchema.success({ id: ctx.key, ...ctx.loader }),
    ]);
  };
}
