import type { ApiCtx, ThunkCtx } from "../query/mod.ts";
import { compose } from "../compose.ts";
import type { AnyState, Next } from "../types.ts";
import {
  LoaderOutput,
  select,
  TableOutput,
  updateStore,
} from "../store/mod.ts";
import { actions, customKey, err, queryCtx } from "./query.ts";
import { nameParser } from "./fetch.ts";

export interface ApiMdwProps<
  Ctx extends ApiCtx = ApiCtx,
  M extends AnyState = AnyState,
> {
  schema: {
    loaders: LoaderOutput<M, AnyState>;
    cache: TableOutput<any, AnyState>;
  };
  errorFn?: (ctx: Ctx) => string;
}

/**
 * This middleware is a composition of many middleware used to faciliate
 * the {@link createApi}.
 *
 * It is not required, however, it is battle-tested and highly recommended.
 */
export function api<Ctx extends ApiCtx = ApiCtx, S extends AnyState = AnyState>(
  props: ApiMdwProps<Ctx, S>,
) {
  return compose<Ctx>([
    err,
    actions,
    queryCtx,
    customKey,
    nameParser,
    loaderApi(props),
    cache(props.schema),
  ]);
}

/**
 * This middleware will automatically cache any data found inside `ctx.json`
 * which is where we store JSON data from the {@link mdw.fetch} middleware.
 */
export function cache<
  Ctx extends ApiCtx = ApiCtx,
>(schema: {
  cache: TableOutput<any, AnyState>;
}) {
  return function* cache(
    ctx: Ctx,
    next: Next,
  ) {
    ctx.cacheData = yield* select(schema.cache.selectById, { id: ctx.key });
    yield* next();
    if (!ctx.cache) return;
    let data;
    if (ctx.json.ok) {
      data = ctx.json.value;
    } else {
      data = ctx.json.error;
    }
    yield* updateStore(schema.cache.add({ [ctx.key]: data }));
    ctx.cacheData = data;
  };
}

/**
 * This middleware will track the status of a middleware fn
 */
export function loader<M extends AnyState = AnyState>(schema: {
  loaders: LoaderOutput<M, AnyState>;
}) {
  return function* <
    Ctx extends ThunkCtx = ThunkCtx,
  >(ctx: Ctx, next: Next) {
    yield* updateStore([
      schema.loaders.start({ id: ctx.name }),
      schema.loaders.start({ id: ctx.key }),
    ]);

    try {
      yield* next();
      yield* updateStore([
        schema.loaders.success({ id: ctx.name }),
        schema.loaders.success({ id: ctx.key }),
      ]);
    } catch (err) {
      yield* updateStore([
        schema.loaders.error({
          id: ctx.name,
          message: err.message,
        }),
        schema.loaders.error({
          id: ctx.key,
          message: err.message,
        }),
      ]);
    } finally {
      const loaders = yield* select((s: any) =>
        schema.loaders.selectByIds(s, { ids: [ctx.name, ctx.key] })
      );
      const ids = loaders
        .filter((loader) => loader.status === "loading")
        .map((loader) => loader.id);
      yield* updateStore(schema.loaders.resetByIds(ids));
    }
  };
}

function defaultErrorFn<Ctx extends ApiCtx = ApiCtx>(ctx: Ctx) {
  const jso = ctx.json;
  if (jso.ok) return "";
  return jso.error?.message || "";
}

/**
 * This middleware will track the status of a fetch request.
 */
export function loaderApi<
  Ctx extends ApiCtx = ApiCtx,
  S extends AnyState = AnyState,
>(
  { schema, errorFn = defaultErrorFn }: ApiMdwProps<Ctx, S>,
) {
  return function* trackLoading(ctx: Ctx, next: Next) {
    try {
      yield* updateStore([
        schema.loaders.start({ id: ctx.name }),
        schema.loaders.start({ id: ctx.key }),
      ]);
      if (!ctx.loader) ctx.loader = {} as any;

      yield* next();

      if (!ctx.response) {
        yield* updateStore(
          schema.loaders.resetByIds([ctx.name, ctx.key]),
        );
        return;
      }

      if (!ctx.loader) {
        ctx.loader = {};
      }

      if (!ctx.response.ok) {
        yield* updateStore([
          schema.loaders.error({
            id: ctx.name,
            message: errorFn(ctx),
            ...ctx.loader,
          }),
          schema.loaders.error({
            id: ctx.key,
            message: errorFn(ctx),
            ...ctx.loader,
          }),
        ]);
        return;
      }

      yield* updateStore([
        schema.loaders.success({ id: ctx.name, ...ctx.loader }),
        schema.loaders.success({ id: ctx.key, ...ctx.loader }),
      ]);
    } finally {
      const loaders = yield* select((s: any) =>
        schema.loaders.selectByIds(s, { ids: [ctx.name, ctx.key] })
      );
      const ids = loaders
        .filter((loader) => loader.status === "loading")
        .map((loader) => loader.id);
      yield* updateStore(schema.loaders.resetByIds(ids));
    }
  };
}
