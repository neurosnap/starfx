import { describe, expect, it } from "../test.ts";
import { createStore, select } from "../store/mod.ts";
import { call } from "../mod.ts";

const tests = describe("createStore()");

interface TestState {
  user: { id: string };
}

it(tests, "should be able to grab values from store", async () => {
  let actual;
  const store = createStore({ initialState: { user: { id: "1" } } });
  await store.run(function* () {
    actual = yield* select((s: TestState) => s.user);
  });
  expect(actual).toEqual({ id: "1" });
});

it(tests, "should be able to grab store from a nested call", async () => {
  let actual;
  const store = createStore({ initialState: { user: { id: "2" } } });
  await store.run(function* () {
    actual = yield* call(function* () {
      return yield* select((s: TestState) => s.user);
    });
  });
  expect(actual).toEqual({ id: "2" });
});
