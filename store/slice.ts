import type { IdProp } from "../types.ts";
import type { QueryState } from "../types.ts";

export const selectDataTable = (s: QueryState) => {
  return s["@@starfx/data"] || {};
};

export const selectDataById = (s: QueryState, { id }: { id: IdProp }) => {
  return selectDataTable(s)[id];
};

export const addData = (props: { [key: string]: unknown }) => {
  function addDataState(s: QueryState) {
    s["@@starfx/data"] = { ...s["@@starfx/data"], ...props };
  }
  return addDataState;
};
