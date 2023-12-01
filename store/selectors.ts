import type { IdProp } from "../types.ts";
import type { LoaderOutput } from "./slice/loader.ts";
import type { TableOutput } from "./slice/table.ts";

export interface QueryState {
  cache: TableOutput<any, any>["initialState"];
  loaders: LoaderOutput<any, any>["initialState"];
}

export const selectDataTable = (s: QueryState) => {
  return s.cache;
};

export const selectDataById = (s: QueryState, { id }: { id: IdProp }) => {
  return selectDataTable(s)[id];
};

export const addData = (props: { [key: string]: any }) => {
  function addDataState(s: QueryState) {
    s.cache = { ...s.cache, ...props };
  }
  return addDataState;
};

export const selectLoaders = (s: QueryState) => {
  return s.loaders;
};

export const selectLoaderById = (s: QueryState, { id }: { id: IdProp }) => {
  return selectLoaders(s)[id];
};
