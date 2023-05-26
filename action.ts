import { QueryState } from "./types.ts";

export const API_ACTION_PREFIX = "@@starfx";
export const createAction = (curType: string) => {
  if (!curType) throw new Error("createAction requires non-empty string");
  const type = `${API_ACTION_PREFIX}/${curType}`;
  const action = () => ({ type });
  action.toString = () => type;
  return action;
};

export const createQueryState = (s: Partial<QueryState> = {}): QueryState => {
  return {
    "@@starfx/loaders": {},
    "@@starfx/data": {},
    ...s,
  };
};
