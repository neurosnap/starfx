import type { LoaderOutput } from "./slice/loader.ts";
import type { TableOutput } from "./slice/table.ts";
import type {
  Callable,
  Operation,
  Patch,
  Result,
  Scope,
  Task,
} from "../deps.ts";
import { BaseCtx } from "../mod.ts";
import type { AnyAction, AnyState } from "../types.ts";

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

export interface BaseSchema<TOutput, GS extends AnyState, N extends keyof GS> {
  initialState: TOutput;
  schema: string;
  name: N;
}

export interface FxStore<S extends AnyState> {
  getScope: () => Scope;
  getState: () => S;
  subscribe: (fn: Listener) => () => void;
  update: (u: StoreUpdater<S> | StoreUpdater<S>[]) => Operation<UpdaterCtx<S>>;
  reset: (ignoreList?: (keyof S)[]) => Operation<UpdaterCtx<S>>;
  run: <T>(op: Callable<T>) => Task<Result<T>>;
  // deno-lint-ignore no-explicit-any
  dispatch: (a: AnyAction) => any;
  replaceReducer: (r: (s: S, a: AnyAction) => S) => void;
  getInitialState: () => S;
  // deno-lint-ignore no-explicit-any
  [Symbol.observable]: () => any;
}

export interface QueryState {
  cache: TableOutput<any, any, any, any>["initialState"];
  loaders: LoaderOutput<any, any>["initialState"];
}
