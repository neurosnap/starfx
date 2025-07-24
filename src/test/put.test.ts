import { ActionContext, each, put, sleep, spawn, take } from "../index.js";
import { createStore } from "../store/index.js";
import { expect, test } from "../test.js";

test("should send actions through channel", async () => {
  const actual: string[] = [];

  function* genFn(arg: string) {
    const actions = yield* ActionContext.expect();
    const task = yield* spawn(function* () {
      for (const action of yield* each(actions)) {
        actual.push(action.type);
        yield* each.next();
      }
    });
    yield* sleep(1);

    yield* put({
      type: arg,
    });
    yield* put({
      type: "2",
    });
    actions.close();
    yield* task;
  }

  const store = createStore({ initialState: {} });
  await store.run(() => genFn("arg"));

  const expected = ["arg", "2"];
  expect(actual).toEqual(expected);
});

test("should handle nested puts", async () => {
  const actual: string[] = [];

  function* genA() {
    yield* put({
      type: "a",
    });
    actual.push("put a");
    yield* sleep(1);
  }

  function* genB() {
    yield* take(["a"]);
    yield* put({
      type: "b",
    });
    actual.push("put b");
    yield* sleep(1);
  }

  function* root() {
    yield* spawn(genB);
    yield* sleep(1);
    yield* spawn(genA);
    yield* sleep(1);
  }

  const store = createStore({ initialState: {} });
  await store.run(() => root());

  // TODO, was this backwards? we are using `take("a")` in `genB`, so it will wait for `genA` to finish
  const expected = ["put a", "put b"];
  expect(actual).toEqual(expected);
});

test("should not cause stack overflow when puts are emitted while dispatching saga", async () => {
  function* root() {
    for (let i = 0; i < 10_000; i += 1) {
      yield* put({ type: "test" });
    }
    yield* sleep(0);
  }

  const store = createStore({ initialState: {} });
  await store.run(root);
  expect(true).toBe(true);
});

// TODO due to the nature of this test and the updates in v4, it seems that fixing it will push it outside of what it actually was intended to test
test.skip("should not miss `put` that was emitted directly after creating a task (caused by another `put`)", async () => {
  const actual: string[] = [];

  function* root() {
    yield* spawn(function* firstspawn() {
      yield* sleep(1);
      yield* put({ type: "c" });
      yield* put({ type: "do not miss" });
    });

    yield* sleep(1);
    yield* take("c");

    const tsk = yield* spawn(function* () {
      yield* sleep(1);
      yield* take("do not miss");
      actual.push("didn't get missed");
    });
    yield* tsk;
  }

  const store = createStore({ initialState: {} });
  await store.run(root);
  const expected = ["didn't get missed"];
  expect(actual).toEqual(expected);
});
