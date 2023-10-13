import { call } from "../fx/mod.ts";
import { compose } from "../compose.ts";
import type { OpFn } from "../types.ts";

import type {
  Action,
  ApiCtx,
  ApiRequest,
  Next,
  PipeCtx,
  RequiredApiRequest,
} from "./types.ts";
import { isObject, mergeRequest } from "./util.ts";

/**
 * This middleware will catch any errors in the pipeline
 * and return the context object.
 */
export function* errorHandler<Ctx extends PipeCtx = PipeCtx>(
  ctx: Ctx,
  next: Next,
) {
  yield* next();

  if (!ctx.result.ok) {
    console.error(
      `Error: ${ctx.result.error.message}.  Check the endpoint [${ctx.name}]`,
      ctx,
    );
    console.error(ctx.result.error);
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
 * This middleware allows the user to override the default key provided to every pipeline function
 * and instead use whatever they want.
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
export function requestMonitor<Ctx extends ApiCtx = ApiCtx>() {
  return compose<Ctx>([
    errorHandler,
    queryCtx,
    urlParser,
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
export function wrap<Ctx extends PipeCtx = PipeCtx>(op: (a: Action) => OpFn) {
  return function* (ctx: Ctx, next: Next) {
    yield* call(() => op(ctx.action));
    yield* next();
  };
}
