import { safe } from "../fx/mod.ts";
import { compose } from "../compose.ts";
import type {
  ApiCtx,
  ApiRequest,
  FetchJsonCtx,
  Next,
  PerfCtx,
  RequiredApiRequest,
  ThunkCtx,
} from "./types.ts";
import { mergeRequest } from "./util.ts";
import * as fetchMdw from "./fetch.ts";
import { log } from "../log.ts";
export * from "./fetch.ts";

/**
 * This middleware will catch any errors in the pipeline
 * and `console.error` the context object.
 *
 * You are highly encouraged to ditch this middleware if you need something
 * more custom.
 *
 * It also sets `ctx.result` which informs us whether the entire
 * middleware pipeline succeeded or not. Think the `.catch()` case for
 * `window.fetch`.
 */
export function* err<Ctx extends ThunkCtx = ThunkCtx>(
  ctx: Ctx,
  next: Next,
) {
  ctx.result = yield* safe(next);
  if (!ctx.result.ok) {
    yield* log({
      type: "query:err",
      payload: {
        message:
          `Error: ${ctx.result.error.message}.  Check the endpoint [${ctx.name}]`,
        ctx,
      },
    });
  }
}

/**
 * This middleware allows the user to override the default key provided
 * to every pipeline function and instead use whatever they want.
 *
 * @example
 * ```ts
 * import { createPipe } from 'starfx';
 *
 * const thunk = createPipe();
 * thunk.use(customKey);
 *
 * const doit = thunk.create('some-action', function*(ctx, next) {
 *   ctx.key = 'something-i-want';
 * })
 * ```
 */
export function* customKey<Ctx extends ThunkCtx = ThunkCtx>(
  ctx: Ctx,
  next: Next,
) {
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
  if (!ctx.json) ctx.json = { ok: false, data: {}, error: {} };
  if (!ctx.actions) ctx.actions = [];
  if (!ctx.bodyType) ctx.bodyType = "json";
  yield* next();
}

/**
 * This middleware is a composition of many middleware used to faciliate
 * the {@link createApi}.
 *
 * It is not required, however,
 */
export function api<Ctx extends ApiCtx = ApiCtx>() {
  return compose<Ctx>([
    err,
    queryCtx,
    customKey,
    fetchMdw.nameParser,
  ]);
}

/**
 * This middleware will add `performance.now()` before and after your
 * middleware pipeline.
 */
export function* perf<Ctx extends PerfCtx = PerfCtx>(
  ctx: Ctx,
  next: Next,
) {
  const t0 = performance.now();
  yield* next();
  const t1 = performance.now();
  ctx.performance = t1 - t0;
}

/**
 * This middleware is a composition of other middleware required to
 * use `window.fetch` {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API}
 * with {@link createApi}
 */
export function fetch<CurCtx extends FetchJsonCtx = FetchJsonCtx>(
  {
    baseUrl = "",
  }: {
    baseUrl?: string;
  } = { baseUrl: "" },
) {
  return compose<CurCtx>([
    fetchMdw.composeUrl(baseUrl),
    fetchMdw.payload,
    fetchMdw.request,
    fetchMdw.json,
  ]);
}
