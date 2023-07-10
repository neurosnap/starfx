import type { Result } from "https://deno.land/x/effection@3.0.0-alpha.9/mod.ts";
export type {
  Channel,
  Instruction,
  Operation,
  Scope,
  Stream,
  Task,
} from "https://deno.land/x/effection@3.0.0-alpha.9/mod.ts";
export {
  action,
  createChannel,
  createContext,
  createScope,
  expect,
  getframe,
  resource,
  run,
  sleep,
  spawn,
  useAbortSignal,
} from "https://deno.land/x/effection@3.0.0-alpha.9/mod.ts";

export type { Result };
export function Ok<T>(value: T): Result<T> {
  return { ok: true, value };
}
export function Err<T>(error: Error): Result<T> {
  return { ok: false, error };
}

import React from "https://esm.sh/react@18.2.0";
export { React };
export {
  Provider,
  useDispatch,
  useSelector,
} from "https://esm.sh/react-redux@8.0.5?pin=v122";

export type {
  Action,
  AnyAction,
  Middleware,
  Reducer,
  ReducersMapObject,
} from "https://esm.sh/@reduxjs/toolkit@1.9.5?pin=v122";
export {
  combineReducers,
  configureStore,
  createImmutableStateInvariantMiddleware,
  createSerializableStateInvariantMiddleware,
  getDefaultMiddleware,
} from "https://esm.sh/@reduxjs/toolkit@1.9.5?pin=v122";
export {
  BATCH,
  batchActions,
  enableBatching,
} from "https://esm.sh/redux-batched-actions@0.5.0?pin=v122";
export type {
  LoadingItemState,
  LoadingMapPayload,
  LoadingState,
  MapEntity,
} from "https://esm.sh/robodux@15.0.1?pin=v122";
export {
  createAction,
  createAssign,
  createLoaderTable,
  createReducerMap,
  createTable,
  defaultLoader,
  defaultLoadingItem,
} from "https://esm.sh/robodux@15.0.1?pin=v122";
