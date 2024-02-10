import { createThunks, type ThunksApi } from "./thunk.ts";
import * as mdw from "./mdw.ts";

export * from "./api.ts";
export * from "./types.ts";
export * from "./create-key.ts";
export * from "./action.ts";

export { createThunks, mdw, ThunksApi };

/**
 * @deprecated Use {@link createThunks} instead;
 */
export const createPipe = createThunks;
/**
 * @deprecated Use {@link mdw.err} instead;
 */
export const errorHandler = mdw.err;
/**
 * @deprecated Use {@link mdw.query} instead;
 */
export const queryCtx = mdw.queryCtx;
/**
 * @deprecated Use {@link fetchMdw.composeUrl} instead;
 */
export const urlParser = mdw.composeUrl;
/**
 * @deprecated Use {@link mdw.customKey} instead;
 */
export const customKey = mdw.customKey;
/**
 * @deprecated Use {@link mdw.api} instead;
 */
export const requestMonitor = mdw.api;
/**
 * @deprecated Use {@link mdw.fetch} instead;
 */
export const fetcher = mdw.fetch;
