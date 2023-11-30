import { describe, expect, it } from "../test.ts";
import { select } from "./mod.ts";
import { configureStore } from "./store.ts";
import { call } from "../deps.ts";

const tests = describe("configureStore()");

interface TestState {
  user: { id: string };
}

it(tests, "should be able to grab values from store", async () => {
  let actual;
  const store = configureStore({ initialState: { user: { id: "1" } } });
  await store.run(function* () {
    actual = yield* select((s: TestState) => s.user);
  });
  expect(actual).toEqual({ id: "1" });
});

it(tests, "should be able to grab store from a nested call", async () => {
  let actual;
  const store = configureStore({ initialState: { user: { id: "2" } } });
  await store.run(function* () {
    actual = yield* call(function* () {
      return yield* select((s: TestState) => s.user);
    });
  });
  expect(actual).toEqual({ id: "2" });
});
