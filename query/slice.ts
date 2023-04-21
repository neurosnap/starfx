import { createLoaderTable, createReducerMap, createTable } from "../deps.ts";
import type { LoadingItemState } from "../deps.ts";

import { createKey } from "./create-key.ts";

export { defaultLoader, defaultLoadingItem } from "../deps.ts";

export interface QueryState {
  "@@saga-query/loaders": { [key: string]: LoadingItemState };
  "@@saga-query/data": { [key: string]: any };
}

export const LOADERS_NAME = `@@saga-query/loaders`;
export const loaders = createLoaderTable({ name: LOADERS_NAME });
export const {
  loading: setLoaderStart,
  error: setLoaderError,
  success: setLoaderSuccess,
  resetById: resetLoaderById,
} = loaders.actions;
export const { selectTable: selectLoaders, selectById: selectLoaderById } =
  loaders.getSelectors((state: any) => state[LOADERS_NAME] || {});

export const DATA_NAME = `@@saga-query/data`;
export const data = createTable<any>({ name: DATA_NAME });
export const { add: addData, reset: resetData } = data.actions;

export const { selectTable: selectData, selectById: selectDataById } = data
  .getSelectors((s: any) => s[DATA_NAME] || {});

/**
 * Returns data from the saga-query slice of redux from an action.
 */
export const selectDataByName = (
  s: any,
  p: { name: string; payload?: any },
) => {
  const id = createKey(p.name, p.payload);
  const data = selectDataById(s, { id });
  return data;
};

export const reducers = createReducerMap(loaders, data);

export const createQueryState = (s: Partial<QueryState> = {}): QueryState => {
  return {
    [LOADERS_NAME]: {},
    [DATA_NAME]: {},
    ...s,
  };
};
