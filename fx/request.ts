import { expect, useAbortSignal } from "../deps.ts";

export function* request(url: string | URL | Request, opts?: RequestInit) {
  const signal = yield* useAbortSignal();
  const response = yield* expect(fetch(url, { signal, ...opts }));
  return response;
}
