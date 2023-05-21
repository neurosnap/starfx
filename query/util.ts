import type { ApiRequest, RequiredApiRequest } from "./types.ts";
import { API_ACTION_PREFIX } from "./constant.ts";

export const noop = () => {};
// deno-lint-ignore no-explicit-any
export const isFn = (fn?: any) => fn && typeof fn === "function";
// deno-lint-ignore no-explicit-any
export const isObject = (obj?: any) => typeof obj === "object" && obj !== null;
export const createAction = (curType: string) => {
  if (!curType) throw new Error("createAction requires non-empty string");
  const type = `${API_ACTION_PREFIX}/${curType}`;
  const action = () => ({ type });
  action.toString = () => type;
  return action;
};

export const mergeHeaders = (
  cur?: HeadersInit,
  next?: HeadersInit,
): HeadersInit => {
  if (!cur && !next) return {};
  if (!cur && next) return next;
  if (cur && !next) return cur;
  return { ...cur, ...next };
};

export const mergeRequest = (
  cur?: ApiRequest | null,
  next?: ApiRequest | null,
): RequiredApiRequest => {
  const defaultReq = { url: "", method: "GET", headers: mergeHeaders() };
  if (!cur && !next) return { ...defaultReq, headers: mergeHeaders() };
  if (!cur && next) return { ...defaultReq, ...next };
  if (cur && !next) return { ...defaultReq, ...cur };
  return {
    ...defaultReq,
    ...cur,
    ...next,
    headers: mergeHeaders(cur?.headers, next?.headers),
  };
};

export const sleep = (n: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, n);
  });
