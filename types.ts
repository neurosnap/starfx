import type { Instruction, Operation } from "./deps.ts";

export interface Computation<T = any> {
  [Symbol.iterator](): Iterator<Instruction, T, any>;
}

export type ActionType = string;
export interface Action {
  type: ActionType;
  payload?: any;
  meta?: any;
  error?: boolean;
}
export interface ActionWPayload<P> {
  type: ActionType;
  payload: P;
}
export type AnyAction = Action | ActionWPayload<unknown>;

export type OpFn<T = unknown> =
  | (() => Operation<T>)
  | (() => PromiseLike<T>)
  | (() => T);

export interface StoreLike<S = unknown> {
  getState: () => S;
  dispatch: (action: Action) => void;
}
