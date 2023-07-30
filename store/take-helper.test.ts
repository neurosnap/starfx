import { describe, expect, it } from "../test.ts";
import { sleep } from "../deps.ts";

import type { AnyAction } from "./types.ts";
import { configureStore } from "./mod.ts";
import { take, takeEvery, takeLatest, takeLeading } from "./fx.ts";

const testEvery = describe("takeEvery()");
const testLatest = describe("takeLatest()");
const testLeading = describe("takeLeading()");

it(testLatest, "should cancel previous tasks and only use latest", async () => {
  const actual: string[] = [];
  function* worker(action: AnyAction) {
    if (action.payload !== "3") {
      yield* sleep(3000);
    }
    actual.push(action.payload);
  }

  function* root() {
    const task = yield* takeLatest("ACTION", worker);
    yield* take("CANCEL_WATCHER");
    yield* task.halt();
  }
  const store = await configureStore({ initialState: {} });
  const task = store.run(root);

  store.dispatch({ type: "ACTION", payload: "1" });
  store.dispatch({ type: "ACTION", payload: "2" });
  store.dispatch({ type: "ACTION", payload: "3" });
  store.dispatch({ type: "CANCEL_WATCHER" });

  await task;

  expect(actual).toEqual(["3"]);
});

it(testLeading, "should keep first action and discard the rest", async () => {
  let called = 0;
  const actual: string[] = [];
  function* worker(action: AnyAction) {
    called += 1;
    yield* sleep(100);
    actual.push(action.payload);
  }

  function* root() {
    const task = yield* takeLeading("ACTION", worker);
    yield* sleep(150);
    yield* task.halt();
  }
  const store = await configureStore({ initialState: {} });
  const task = store.run(root);

  store.dispatch({ type: "ACTION", payload: "1" });
  store.dispatch({ type: "ACTION", payload: "2" });
  store.dispatch({ type: "ACTION", payload: "3" });

  await task;

  expect(actual).toEqual(["1"]);
  expect(called).toEqual(1);
});

it(testEvery, "should receive all actions", async () => {
  const loop = 10;
  const actual: string[][] = [];

  function* root() {
    const task = yield* takeEvery(
      "ACTION",
      (action) => worker("a1", "a2", action),
    );
    yield* take("CANCEL_WATCHER");
    yield* task.halt();
  }

  // deno-lint-ignore require-yield
  function* worker(arg1: string, arg2: string, action: AnyAction) {
    actual.push([arg1, arg2, action.payload]);
  }

  const store = await configureStore({ initialState: {} });
  const task = store.run(root);

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
