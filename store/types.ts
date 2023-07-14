import type { Operation, Patch, Result, Scope, Task } from "../deps.ts";
import type { OpFn } from "../types.ts";

export type StoreUpdater<S extends AnyState> = (s: S) => S | void;

export type Listener = () => void;

export interface UpdaterCtx<S extends AnyState> {
  updater: StoreUpdater<S> | StoreUpdater<S>[];
  patches: Patch[];
}

export interface AnyAction {
  type: string;
  [key: string]: any;
}

export interface ActionWPayload<P> {
  type: string;
  payload: P;
}

export type AnyState = Record<string, any>;

declare global {
  interface SymbolConstructor {
    readonly observable: symbol;
  }
}

export interface FxStore<S extends AnyState> {
  getScope: () => Scope;
  getState: () => S;
  subscribe: (fn: Listener) => () => void;
  update: (u: StoreUpdater<S>) => Operation<Result<UpdaterCtx<S>>>;
  run: <T>(op: OpFn<T>) => Task<Result<T>>;
  dispatch: (a: AnyAction) => Task<any>;
  replaceReducer: (r: (s: S, a: AnyAction) => S) => void;
  [Symbol.observable]: () => any;
}
