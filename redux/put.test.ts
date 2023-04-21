import { describe, expect, it, setupReduxScope } from "../test.ts";
import { sleep, spawn } from "../deps.ts";

import { ActionContext, put, take } from "./index.ts";

const putTests = describe("put()");

it(putTests, "should send actions through channel", async () => {
  const actual: string[] = [];

  function* genFn(arg: string) {
    yield* spawn(function* () {
      const actions = yield* ActionContext;
      const msgs = yield* actions.output;
      let action = yield* msgs;
      while (!action.done) {
        actual.push(action.value.type);
        action = yield* msgs;
      }
    });

    yield* put({
      type: arg,
    });
    yield* put({
      type: "2",
    });
  }

  const scope = setupReduxScope();
  await scope.run(() => genFn("arg"));

  const expected = ["arg", "2"];
  expect(actual).toEqual(expected);
});

it(putTests, "should handle nested puts", async () => {
  const actual: string[] = [];

  function* genA() {
    yield* put({
      type: "a",
    });
    actual.push("put a");
  }

  function* genB() {
    yield* take(["a"]);
    yield* put({
      type: "b",
    });
    actual.push("put b");
  }

  function* root() {
    yield* spawn(genB);
    yield* spawn(genA);
  }

  const scope = setupReduxScope();
  await scope.run(() => root());

  const expected = ["put b", "put a"];
  expect(actual).toEqual(expected);
});

it(
  putTests,
  "should not cause stack overflow when puts are emitted while dispatching saga",
  async () => {
    function* root() {
      for (let i = 0; i < 40_000; i += 1) {
        yield* put({ type: "test" });
      }
      yield* sleep(0);
    }

    const scope = setupReduxScope();
    await scope.run(() => root());
    expect(true).toBe(true);
  },
);

it(
  putTests,
  "should not miss `put` that was emitted directly after creating a task (caused by another `put`)",
  async () => {
    const actual: string[] = [];

    function* root() {
      yield* spawn(function* firstspawn() {
        yield* sleep(1000);
        yield* put({ type: "c" });
        yield* put({ type: "do not miss" });
      });

      yield* take("c");

      const tsk = yield* spawn(function* () {
        yield* take("do not miss");
        actual.push("didn't get missed");
      });
      yield* tsk;
    }

    const scope = setupReduxScope();
    await scope.run(() => root());
    const expected = ["didn't get missed"];
    expect(actual).toEqual(expected);
  },
);
