import { call, useAbortSignal } from "effection";

export function* request(url: string | URL | Request, opts?: RequestInit) {
  const signal = yield* useAbortSignal();
  const response = yield* call(() => fetch(url, { signal, ...opts }));
  return response;
}

export function* json(response: Response) {
  const result = yield* call(() => response.json());
  return result;
}
