import { describe, expect, it } from "../test.ts";
import { call } from "../fx/mod.ts";

import { select } from "./mod.ts";
import { configureStore } from "./store.ts";

const tests = describe("configureStore()");

interface TestState {
  user: { id: string };
}

it(tests, "should be able to grab values from store", async () => {
  const store = await configureStore({ initialState: { user: { id: "1" } } });
  await store.run(function* () {
    const actual = yield* select((s: TestState) => s.user);
    expect(actual).toEqual({ id: "1" });
  });
});

it(tests, "should be able to grab store from a nested call", async () => {
  const store = await configureStore({ initialState: { user: { id: "2" } } });
  await store.run(function* () {
    const actual = yield* call(function* () {
      return yield* select((s: TestState) => s.user);
    });
    expect(actual).toEqual({ id: "2" });
  });
});
