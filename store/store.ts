import {
  Callable,
  createScope,
  createSignal,
  enablePatches,
  Ok,
  produceWithPatches,
  Result,
  Scope,
  Task,
} from "../deps.ts";
import { BaseMiddleware, compose } from "../compose.ts";
import type { AnyAction, AnyState } from "../types.ts";
import { safe } from "../fx/mod.ts";
import { Next } from "../query/types.ts";
import type { FxStore, Listener, StoreUpdater, UpdaterCtx } from "./types.ts";
import { ActionContext, StoreContext, StoreUpdateContext } from "./context.ts";
import { emit } from "./fx.ts";
import { log } from "../log.ts";
import type { FxSchema } from "./types.ts";

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
  schema: FxSchema<S>;
  scope?: Scope;
  middleware?: BaseMiddleware<UpdaterCtx<S>>[];
}

export function createStore<S extends AnyState>({
  schema,
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

  let state = schema.initialState;
  const listeners = new Set<Listener>();
  enablePatches();

  const signal = createSignal<AnyAction, void>();
  scope.set(ActionContext, signal);

  function getScope() {
    return scope;
  }

  function getState() {
    return state;
  }

  function getSchema() {
    return schema;
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

  function* logMdw(ctx: UpdaterCtx<S>, next: Next) {
    yield* log({
      type: "store",
      payload: { ctx },
    });
    yield* next();
  }

  function* notifyChannelMdw(_: UpdaterCtx<S>, next: Next) {
    const chan = yield* StoreUpdateContext;
    yield* chan.send();
    yield* next();
  }

  function* notifyListenersMdw(_: UpdaterCtx<S>, next: Next) {
    listeners.forEach((f) => f());
    yield* next();
  }

  function createUpdater() {
    const fn = compose<UpdaterCtx<S>>([
      updateMdw,
      ...middleware,
      logMdw,
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

    if (!ctx.result.ok) {
      yield* log({
        type: "error:store",
        payload: {
          message: `Exception raised when calling store updaters`,
          error: ctx.result.error,
        },
      });
    }

    return ctx;
  }

  function dispatch(action: AnyAction | AnyAction[]) {
    emit({ signal, action });
  }

  function run<T>(op: Callable<T>): Task<Result<T>> {
    return scope.run(() => safe(op));
  }

  function getInitialState() {
    return schema.initialState;
  }

  function* reset(ignoreList: (keyof S)[] = []) {
    return yield* update((s) => {
      const keep = ignoreList.reduce<S>((acc, key) => {
        acc[key] = s[key];
        return acc;
      }, { ...schema.initialState });

      Object.keys(s).forEach((key: keyof S) => {
        s[key] = keep[key];
      });
    });
  }

  return {
    getScope,
    getSchema,
    getState,
    subscribe,
    update,
    reset,
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
    getInitialState,
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
