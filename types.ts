import type { Operation } from "./deps.ts";

export type ActionType = string;
export interface Action<P = any> {
  type: ActionType;
  payload?: P;
}
export type OpFn<T = unknown> =
  | (() => Operation<T>)
  | (() => PromiseLike<T>)
  | (() => T);

export interface StoreLike<S = unknown> {
  getState: () => S;
  dispatch: (action: Action) => void;
}
