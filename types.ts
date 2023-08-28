import type { Instruction, Operation } from "./deps.ts";
import type { FxStore, AnyState }  from "./store/types.ts";
export interface Computation<T = unknown> {
  // deno-lint-ignore no-explicit-any
  [Symbol.iterator](): Iterator<Instruction, T, any>;
}

export type OpFn<T = unknown> =
  | (() => Operation<T>)
  | (() => PromiseLike<T>)
  | (() => T);

export interface QueryState {
  "@@starfx/loaders": Record<IdProp, LoadingItemState>;
  "@@starfx/data": Record<string, unknown>;
}

export type IdProp = string | number;
export type LoadingStatus = "loading" | "success" | "error" | "idle";
export interface LoadingItemState<
  M extends Record<IdProp, unknown> = Record<IdProp, unknown>,
> {
  id: IdProp;
  status: LoadingStatus;
  message: string;
  lastRun: number;
  lastSuccess: number;
  meta: M;
}

export interface LoadingState<
  M extends Record<IdProp, unknown> = Record<IdProp, unknown>,
> extends LoadingItemState<M> {
  isIdle: boolean;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isInitialLoading: boolean;
}

export type LoadingPayload =
  & Pick<LoadingItemState, "id">
  & Partial<Pick<LoadingItemState, "message" | "meta">>;

export interface Payload<P = any> {
  payload: P;
}

export interface RootState extends QueryState, FxStore<AnyState> {
  [key: string]: any;
}


