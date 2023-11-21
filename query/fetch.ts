import { safe } from "../fx/mod.ts";
import type { FetchCtx, FetchJsonCtx, Next } from "./types.ts";

/**
 * Automatically sets `content-type` to `application/json` when
 * that header is not already present.
 */
export function* headers<CurCtx extends FetchCtx = FetchCtx>(
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
export function* json<CurCtx extends FetchJsonCtx = FetchJsonCtx>(
  ctx: CurCtx,
  next: Next,
) {
  if (!ctx.response) {
    yield* next();
    return;
  }

  if (ctx.response.status === 204) {
    ctx.json = {
      ok: true,
      data: {},
      value: {},
    };
    yield* next();
    return;
  }

  const data = yield* safe(() => {
    const resp = ctx.response;
    if (!resp) throw new Error("response is falsy");
    return resp[ctx.bodyType]();
  });

  if (data.ok) {
    if (ctx.response.ok) {
      ctx.json = {
        ok: true,
        data: data.value,
        value: data.value,
      };
    } else {
      ctx.json = {
        ok: false,
        data: data.value,
        error: data.value,
      };
    }
  } else {
    const dta = { message: data.error.message };
    ctx.json = {
      ok: false,
      data: dta,
      error: dta,
    };
  }

  yield* next();
}

/*
 * This middleware takes the `baseUrl` provided to `fetcher()` and combines it
 * with the url from `ctx.request.url`.
 */
export function composeUrl<CurCtx extends FetchJsonCtx = FetchJsonCtx>(
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
export function* payload<CurCtx extends FetchJsonCtx = FetchJsonCtx>(
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
      const data =
        `found :${key} in endpoint name (${ctx.name}) but payload has falsy value (${val})`;
      ctx.json = {
        ok: false,
        data,
        error: data,
      };
      return;
    }
  }

  yield* next();
}

/*
 * This middleware makes the `fetch` http request using `ctx.request` and
 * assigns the response to `ctx.response`.
 */
export function* request<CurCtx extends FetchCtx = FetchCtx>(
  ctx: CurCtx,
  next: Next,
) {
  const { url, ...req } = ctx.req();
  const request = new Request(url, req);
  const result = yield* safe(() => fetch(request));
  if (result.ok) {
    ctx.response = result.value;
  } else {
    throw result.error;
  }
  yield* next();
}
