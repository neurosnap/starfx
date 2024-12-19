import { ActionContext, API_ACTION_PREFIX, emit } from "../action.ts";
import { BaseMiddleware, compose } from "../compose.ts";
import {
  // effection
  createContext,
  createScope,
  createSignal,
  Ok,
  Scope,
  // immer
  enablePatches,
  produceWithPatches,
} from "../deps.ts";
import { StoreContext, StoreUpdateContext } from "./context.ts";
import { createRun } from "./run.ts";

import type { AnyAction, AnyState, Next } from "../types.ts";
import type { FxStore, Listener, StoreUpdater, UpdaterCtx } from "./types.ts";
const stubMsg = "This is merely a stub, not implemented";

let id = 0;

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
  middleware?: BaseMiddleware<UpdaterCtx<S>>[];
  determineNextState?: any;
}

export const IdContext = createContext("starfx:id", 0);

const immerProduceNextState = <S extends AnyState>(
  state: S,
  upds: StoreUpdater<S>[] = []
) => {
  const [nextState, patches, _] = produceWithPatches(state, (draft) => {
    // TODO: check for return value inside updater
    // deno-lint-ignore no-explicit-any
    upds.forEach((updater) => updater(draft as any));
  });
  return { nextState, patches };
};
immerProduceNextState.setup = () => {
  enablePatches();
};

export function createStore<S extends AnyState>({
  initialState,
  scope: initScope,
  middleware = [],
  determineNextState = immerProduceNextState,
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

  const signal = createSignal<AnyAction, void>();
  scope.set(ActionContext, signal);
  scope.set(IdContext, id++);

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

  function dispatch(action: AnyAction | AnyAction[]) {
    emit({ signal, action });
  }

  function getInitialState() {
    return initialState;
  }

  function* reset(ignoreList: (keyof S)[] = []) {
    return yield* update((s) => {
      const keep = ignoreList.reduce<S>(
        (acc, key) => {
          acc[key] = s[key];
          return acc;
        },
        { ...initialState }
      );

      Object.keys(s).forEach((key: keyof S) => {
        s[key] = keep[key];
      });
    });
  }

  function* logMdw(ctx: UpdaterCtx<S>, next: Next) {
    dispatch({
      type: `${API_ACTION_PREFIX}store`,
      payload: ctx,
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

  if (determineNextState?.setup) determineNextState.setup();

  function* updateMdw(ctx: UpdaterCtx<S>, next: Next) {
    const upds: StoreUpdater<S>[] = [];

    if (Array.isArray(ctx.updater)) {
      upds.push(...ctx.updater);
    } else {
      upds.push(ctx.updater);
    }

    const produced = determineNextState(getState(), upds);

    ctx.patches = produced.patches;

    // set the state!
    state = produced.nextState;

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
      dispatch({
        type: `${API_ACTION_PREFIX}store`,
        payload: ctx.result.error,
      });
    }

    return ctx;
  }

  const store = {
    getScope,
    getState,
    subscribe,
    update,
    reset,
    run: createRun(scope),
    // instead of actions relating to store mutation, they
    // refer to pieces of business logic -- that can also mutate state
    dispatch,
    getInitialState,
    [Symbol.observable]: observable,
  };

  // deno-lint-ignore no-explicit-any
  store.getScope().set(StoreContext, store as any);
  return store as any;
}

/**
 * @deprecated use {@link createStore}
 */
export const configureStore = createStore;
