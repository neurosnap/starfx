export * from "./pipe.ts";
export * from "./api.ts";
export * from "./types.ts";
export * from "./create-key.ts";
import * as mdw from "./mdw.ts";

export { mdw };

/**
 * @deprecated Use {@link mdw.err} instead;
 */
export const errorHandler = mdw.err;
/**
 * @deprecated Use {@link mdw.query} instead;
 */
export const queryCtx = mdw.query;
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
