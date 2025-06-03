import { createThunks, type ThunksApi } from "./thunk.ts";

export * from "./api.ts";
export * from "./types.ts";
export * from "./create-key.ts";

export { createThunks, type ThunksApi };

/**
 * @deprecated Use {@link createThunks} instead;
 */
export const createPipe = createThunks;
