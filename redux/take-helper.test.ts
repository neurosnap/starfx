import { describe, expect, it } from "../test.ts";
import { cancel } from "../fx/index.ts";
import type { Action } from "../types.ts";

import { setupStore, take, takeEvery } from "./index.ts";

const testEvery = describe("takeEvery()");

it(testEvery, "should work", async () => {
  const loop = 10;
  const actual: string[][] = [];

  function* root() {
    const task = yield* takeEvery(
      "ACTION",
      (action) => worker("a1", "a2", action),
    );
    yield* take("CANCEL_WATCHER");
    yield* cancel(task);
  }

  function* worker(arg1: string, arg2: string, action: Action) {
    actual.push([arg1, arg2, action.payload]);
  }

  const { store, fx } = setupStore({ reducer: (s) => s });
  const task = fx.run(root);

  for (let i = 1; i <= loop / 2; i += 1) {
    store.dispatch({
      type: "ACTION",
      payload: i,
    });
  }

  // no further task should be forked after this
  store.dispatch({
    type: "CANCEL_WATCHER",
  });

  for (let i = loop / 2 + 1; i <= loop; i += 1) {
    store.dispatch({
      type: "ACTION",
      payload: i,
    });
  }
  await task;

  expect(actual).toEqual([
    ["a1", "a2", 1],
    ["a1", "a2", 2],
    ["a1", "a2", 3],
    ["a1", "a2", 4],
    ["a1", "a2", 5],
  ]);
});
