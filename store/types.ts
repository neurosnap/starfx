import type { LoaderOutput } from "./slice/loaders.ts";
import type { TableOutput } from "./slice/table.ts";
import type { Operation, Patch, Scope } from "../deps.ts";
import { BaseCtx } from "../mod.ts";
import type { AnyAction, AnyState } from "../types.ts";
import { createRun } from "./run.ts";

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

export interface FxMap {
  loaders: <M extends AnyState>(s: string) => LoaderOutput<M, AnyState>;
  cache: (s: string) => TableOutput<any, AnyState>;
  [key: string]: (name: string) => BaseSchema<unknown>;
}

export type FxSchema<S extends AnyState, O extends FxMap = FxMap> =
  & {
    [key in keyof O]: ReturnType<O[key]>;
  }
  & { update: FxStore<S>["update"] };

export interface FxStore<S extends AnyState> {
  getScope: () => Scope;
  getState: () => S;
  subscribe: (fn: Listener) => () => void;
  update: (u: StoreUpdater<S> | StoreUpdater<S>[]) => Operation<UpdaterCtx<S>>;
  reset: (ignoreList?: (keyof S)[]) => Operation<UpdaterCtx<S>>;
  run: ReturnType<typeof createRun>;
  // deno-lint-ignore no-explicit-any
  dispatch: (a: AnyAction) => any;
  replaceReducer: (r: (s: S, a: AnyAction) => S) => void;
  getInitialState: () => S;
  // deno-lint-ignore no-explicit-any
  [Symbol.observable]: () => any;
}

export interface QueryState {
  cache: TableOutput<any, any>["initialState"];
  loaders: LoaderOutput<any, any>["initialState"];
}
