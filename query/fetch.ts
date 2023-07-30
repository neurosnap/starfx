import { call } from "../fx/mod.ts";
import { Err, Ok, sleep } from "../deps.ts";
import { compose } from "../compose.ts";

import { noop } from "./util.ts";
import type { FetchCtx, FetchJsonCtx, Next } from "./types.ts";

/**
 * Automatically sets `content-type` to `application/json` when
 * that header is not already present.
 */
export function* headersMdw<CurCtx extends FetchCtx = FetchCtx>(
  ctx: CurCtx,
  next: Next,
) {
  if (!ctx.request) {
    yield* next();
    return;
  }

  const cur = ctx.req();
  if (!Object.hasOwn(cur.headers, "Content-Type")) {
    ctx.request = ctx.req({
      headers: { "Content-Type": "application/json" },
    });
  }

  yield* next();
}

/**
 * This middleware takes the `ctx.response` and sets `ctx.json` to the body representation
 * requested.  It uses the `ctx.bodyType` property to determine how to represent the body.
 * The default is set to `json` which calls `Response.json()`.
 *
 * @example
 * ```ts
 * const fetchUsers = api.get('/users', function*(ctx, next) {
 *  ctx.bodyType = 'text'; // calls Response.text();
 *  yield next();
 * })
 * ```
 */
export function* jsonMdw<CurCtx extends FetchJsonCtx = FetchJsonCtx>(
  ctx: CurCtx,
  next: Next,
) {
  if (!ctx.response) {
    yield* next();
    return;
  }

  if (ctx.response.status === 204) {
    ctx.json = Ok({});
    yield* next();
    return;
  }

  const data = yield* call(() => {
    const resp = ctx.response;
    if (!resp) throw new Error("response is falsy");
    return resp[ctx.bodyType]();
  });

  if (data.ok) {
    ctx.json = Ok(data.value);
  } else {
    ctx.json = Err(data.error);
  }

  yield* next();
}

/*
 * This middleware takes the `baseUrl` provided to `fetcher()` and combines it
 * with the url from `ctx.request.url`.
 */
export function apiUrlMdw<CurCtx extends FetchJsonCtx = FetchJsonCtx>(
  baseUrl = "",
) {
  return function* (ctx: CurCtx, next: Next) {
    const req = ctx.req();
    ctx.request = ctx.req({ url: `${baseUrl}${req.url}` });
    yield* next();
  };
}

/**
 * If there's a slug inside the ctx.name (which is the URL segement in this case)
 * and there is *not* a corresponding truthy value in the payload, then that means
 * the user has an empty value (e.g. empty string) which means we want to abort the
 * fetch request.
 *
 * e.g. `ctx.name = "/apps/:id"` with `payload = { id: '' }`
 *
 * Ideally the action wouldn't have been dispatched at all but that is *not* a
 * gaurantee we can make here.
 */
export function* payloadMdw<CurCtx extends FetchJsonCtx = FetchJsonCtx>(
  ctx: CurCtx,
  next: Next,
) {
  const payload = ctx.payload;
  if (!payload) {
    yield* next();
    return;
  }

  const keys = Object.keys(payload);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (!ctx.name.includes(`:${key}`)) {
      continue;
    }

    const val = payload[key];
    if (!val) {
      const msg =
        `found :${key} in endpoint name (${ctx.name}) but payload has falsy value (${val})`;
      ctx.json = Err(new Error(msg));
      return;
    }
  }

  yield* next();
}

/*
 * This middleware makes the `fetch` http request using `ctx.request` and
 * assigns the response to `ctx.response`.
 */
export function* fetchMdw<CurCtx extends FetchCtx = FetchCtx>(
  ctx: CurCtx,
  next: Next,
) {
  const { url, ...req } = ctx.req();
  const request = new Request(url, req);
  const response = yield* call(() => fetch(request));
  if (response.ok) {
    ctx.response = response.value;
  } else {
    throw response.error;
  }
  yield* next();
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
      yield* fetchMdw(ctx, noop);
      yield* call(() => jsonMdw(ctx, noop));

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
    headersMdw,
    apiUrlMdw(baseUrl),
    payloadMdw,
    fetchMdw,
    jsonMdw,
  ]);
}
