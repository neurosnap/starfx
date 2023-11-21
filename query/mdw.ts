import { safe } from "../fx/mod.ts";
import { compose } from "../compose.ts";
import type {
  ApiCtx,
  ApiRequest,
  FetchJsonCtx,
  Next,
  PerfCtx,
  PipeCtx,
  RequiredApiRequest,
} from "./types.ts";
import { isObject, mergeRequest } from "./util.ts";
import { sleep } from "../deps.ts";
import { noop } from "./util.ts";
import * as fetchMdw from "./fetch.ts";

/**
 * This middleware will catch any errors in the pipeline
 * and `console.error` the context object.
 *
 * It also sets `ctx.result` to `Err()`
 */
export function* err<Ctx extends PipeCtx = PipeCtx>(
  ctx: Ctx,
  next: Next,
) {
  ctx.result = yield* safe(next);
  if (!ctx.result.ok) {
    console.error(
      `Error: ${ctx.result.error.message}.  Check the endpoint [${ctx.name}]`,
      ctx,
    );
  }
}

/**
 * This middleware sets up the context object with some values that are
 * necessary for {@link createApi} to work properly.
 */
export function* query<Ctx extends ApiCtx = ApiCtx>(ctx: Ctx, next: Next) {
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
 * This middleware converts the name provided to {@link createApi} into data for the fetch request.
 */
export function* request<Ctx extends ApiCtx = ApiCtx>(ctx: Ctx, next: Next) {
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
export function api<Ctx extends ApiCtx = ApiCtx>() {
  return compose<Ctx>([
    err,
    query,
    request,
    customKey,
  ]);
}

/**
 * This middleware will add `performance.now()` before and after your middleware pipeline.
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

function backoffExp(attempt: number): number {
  if (attempt > 5) return -1;
  // 1s, 1s, 1s, 2s, 4s
  return Math.max(2 ** attempt * 125, 1000);
}

/**
 * This middleware will retry failed `Fetch` request if `response.ok` is `false`.
 * It accepts a backoff function to determine how long to continue retrying.
 * The default is an exponential backoff {@link backoffExp} where the minimum is
 * 1sec between attempts and it'll reach 4s between attempts at the end with a
 * max of 5 attempts.
 *
 * An example backoff:
 * @example
 * ```ts
 *  // Any value less than 0 will stop the retry middleware.
 *  // Each attempt will wait 1s
 *  const backoff = (attempt: number) => {
 *    if (attempt > 5) return -1;
 *    return 1000;
 *  }
 *
 * const api = createApi();
 * api.use(requestMonitor());
 * api.use(api.routes());
 * api.use(fetcher());
 *
 * const fetchUsers = api.get('/users', [
 *  function*(ctx, next) {
 *    // ...
 *    yield next();
 *  },
 *  // fetchRetry should be after your endpoint function because
 *  // the retry middleware will update `ctx.json` before it reaches your middleware
 *  fetchRetry(backoff),
 * ])
 * ```
 */
export function fetchRetry<CurCtx extends FetchJsonCtx = FetchJsonCtx>(
  backoff: (attempt: number) => number = backoffExp,
) {
  return function* (ctx: CurCtx, next: Next) {
    yield* next();

    if (!ctx.response) {
      return;
    }

    if (ctx.response.ok) {
      return;
    }

    let attempt = 1;
    let waitFor = backoff(attempt);
    while (waitFor >= 1) {
      yield* sleep(waitFor);
      yield* safe(() => fetchMdw.request(ctx, noop));
      yield* safe(() => fetchMdw.json(ctx, noop));

      if (ctx.response.ok) {
        return;
      }

      attempt += 1;
      waitFor = backoff(attempt);
    }
  };
}

/**
 * This middleware is a composition of other middleware required to use `window.fetch`
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API} with {@link createApi}
 */
export function fetcher<CurCtx extends FetchJsonCtx = FetchJsonCtx>(
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
