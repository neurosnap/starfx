import {
  createScope,
  enablePatches,
  Ok,
  produceWithPatches,
  Result,
  Scope,
  Task,
} from "../deps.ts";
import { BaseMiddleware, compose } from "../compose.ts";
import type { AnyAction, AnyState, OpFn } from "../types.ts";
import { safe } from "../fx/mod.ts";
import { Next } from "../query/types.ts";

import type { FxStore, Listener, StoreUpdater, UpdaterCtx } from "./types.ts";
import { StoreContext, StoreUpdateContext } from "./context.ts";
import { put } from "./fx.ts";

const stubMsg = "This is merely a stub, not implemented";

// https://github.com/reduxjs/redux/blob/4a6d2fb227ba119d3498a43fab8f53fe008be64c/src/createStore.ts#L344
function observable() {
  return {
    subscribe: (_observer: unknown) => {
      throw new Error(stubMsg);
    },
    [Symbol.observable]() {
      return this;
    },
  };
}

export interface CreateStore<S extends AnyState> {
  scope?: Scope;
  initialState: S;
  middleware?: BaseMiddleware[];
}

export function createStore<S extends AnyState>({
  initialState,
  scope: initScope,
  middleware = [],
}: CreateStore<S>): FxStore<S> {
  let scope: Scope;
  if (initScope) {
    scope = initScope;
  } else {
    const tuple = createScope();
    scope = tuple[0];
  }

  let state = initialState;
  const listeners = new Set<Listener>();
  enablePatches();

  function getScope() {
    return scope;
  }

  function getState() {
    return state;
  }

  function subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function* updateMdw(ctx: UpdaterCtx<S>, next: Next) {
    const upds: StoreUpdater<S>[] = [];

    if (Array.isArray(ctx.updater)) {
      upds.push(...ctx.updater);
    } else {
      upds.push(ctx.updater);
    }

    const [nextState, patches, _] = produceWithPatches(getState(), (draft) => {
      // TODO: check for return value inside updater
      // deno-lint-ignore no-explicit-any
      upds.forEach((updater) => updater(draft as any));
    });
    ctx.patches = patches;

    // set the state!
    state = nextState;

    yield* next();
  }

  function* notifyChannelMdw(_: UpdaterCtx<S>, next: Next) {
    const chan = yield* StoreUpdateContext;
    yield* chan.input.send();
    yield* next();
  }

  function* notifyListenersMdw(_: UpdaterCtx<S>, next: Next) {
    listeners.forEach((f) => f());
    yield* next();
  }

  function createUpdater() {
    const fn = compose<UpdaterCtx<S>>([
      ...middleware,
      updateMdw,
      notifyChannelMdw,
      notifyListenersMdw,
    ]);

    return fn;
  }

  const mdw = createUpdater();
  function* update(updater: StoreUpdater<S> | StoreUpdater<S>[]) {
    const ctx = {
      updater,
      patches: [],
      result: Ok(undefined),
    };
    yield* mdw(ctx);
    // TODO: dev mode only?
    if (!ctx.result.ok) {
      console.error(ctx.result);
    }
    return ctx;
  }

  // deno-lint-ignore no-explicit-any
  function dispatch(action: AnyAction | AnyAction[]): Task<any> {
    return scope.run(function* () {
      yield* put(action);
    });
  }

  function run<T>(op: OpFn<T>): Task<Result<T>> {
    return scope.run(function* () {
      return yield* safe(op);
    });
  }

  return {
    getScope,
    getState,
    subscribe,
    update,
    run,
    // instead of actions relating to store mutation, they
    // refer to pieces of business logic -- that can also mutate state
    dispatch,
    // stubs so `react-redux` is happy
    // deno-lint-ignore no-explicit-any
    replaceReducer<S = any>(
      _nextReducer: (_s: S, _a: AnyAction) => void,
    ): void {
      throw new Error(stubMsg);
    },
    [Symbol.observable]: observable,
  };
}

export function configureStore<S extends AnyState>(
  props: CreateStore<S>,
): FxStore<S> {
  const store = createStore<S>(props);
  // deno-lint-ignore no-explicit-any
  store.getScope().set(StoreContext, store as any);
  return store;
}
