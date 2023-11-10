import type { Operation, Patch, Result, Scope, Task } from "../deps.ts";
import { BaseCtx } from "../mod.ts";
import type { AnyAction, AnyState, Operator } from "../types.ts";

export type StoreUpdater<S extends AnyState> = (s: S) => S | void;

export type Listener = () => void;

export interface UpdaterCtx<S extends AnyState> extends BaseCtx {
  updater: StoreUpdater<S> | StoreUpdater<S>[];
  patches: Patch[];
}

declare global {
  interface SymbolConstructor {
    readonly observable: symbol;
  }
}

export interface BaseSchema<TOutput> {
  initialState: TOutput;
  schema: string;
  name: string;
}

export type Output<O extends { [key: string]: BaseSchema<unknown> }> = {
  [key in keyof O]: O[key]["initialState"];
};

export interface FxStore<S extends AnyState> {
  getScope: () => Scope;
  getState: () => S;
  subscribe: (fn: Listener) => () => void;
  update: (u: StoreUpdater<S> | StoreUpdater<S>[]) => Operation<UpdaterCtx<S>>;
  run: <T>(op: Operator<T>) => Task<Result<T>>;
  // deno-lint-ignore no-explicit-any
  dispatch: (a: AnyAction) => any;
  replaceReducer: (r: (s: S, a: AnyAction) => S) => void;
  getInitialState: () => S;
  // deno-lint-ignore no-explicit-any
  [Symbol.observable]: () => any;
}
