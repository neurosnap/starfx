import { Err, expect, Ok, useAbortSignal } from "../deps.ts";

export function* request(url: string | URL | Request, opts?: RequestInit) {
  const signal = yield* useAbortSignal();
  const response = yield* expect(fetch(url, { signal, ...opts }));
  return response;
}

export function* json(response: Response) {
  try {
    const result = yield* expect(response.json());
    return Ok(result);
  } catch (error) {
    return Err(error);
  }
}
