import { describe, expect, it } from "../test.ts";
import { call } from "../fx/index.ts";
import { Action } from "../types.ts";

import { createFxMiddleware, select } from "./index.ts";

const tests = describe("createMiddleware()");

interface Store<S> {
  getState(): S;
  dispatch(a: Action): void;
}

interface TestState {
  user: { id: string };
}

function createStore<S>(state: S): Store<S> {
  const store = {
    getState(): S {
      return state;
    },
    dispatch(_: Action) {},
  };

  return store;
}

it(tests, "should be able to grab values from store", async () => {
  const store = createStore({ user: { id: "1" } });
  const { run, middleware } = createFxMiddleware();
  middleware(store);
  await run(function* () {
    const actual = yield* select((s: TestState) => s.user);
    expect(actual).toEqual({ id: "1" });
  });
});

it(tests, "should be able to grab store from a nested call", async () => {
  const store = createStore({ user: { id: "2" } });
  const { run, middleware } = createFxMiddleware();
  middleware(store);
  await run(function* () {
    const actual = yield* call(function* () {
      return yield* select((s: TestState) => s.user);
    });
    expect(actual).toEqual({ id: "2" });
  });
});
