import { describe, expect, it } from "../test.ts";

import { run, sleep, spawn } from "../deps.ts";
import { put, take } from "../redux.ts";
import type { Action } from "../types.ts";

const takeTests = describe("take()");

it(
  takeTests,
  "a put should complete before more `take` are added and then consumed automatically",
  async () => {
    const actual: any[] = [];

    function* channelFn() {
      yield* sleep(10);
      yield* put({ type: "action-1", payload: 1 });
      yield* put({ type: "action-1", payload: 2 });
    }

    function* root() {
      yield* spawn(channelFn);

      actual.push(yield* take("action-1"));
      actual.push(yield* take("action-1"));
    }

    await run(root);
    expect(actual).toEqual([
      { type: "action-1", payload: 1 },
      { type: "action-1", payload: 2 },
    ]); // actual: [ { type: "action-1", payload: 1 }, { type: "action-1", payload: 1 } ]
  },
);

it(takeTests, "take from default channel", async () => {
  function* channelFn() {
    yield* sleep(10);
    yield* put({ type: "action-*" });
    yield* put({ type: "action-1" });
    yield* put({ type: "action-2" });
    yield* put({ type: "unnoticeable-action" });
    yield* put({
      type: "",
      payload: {
        isAction: true,
      },
    });
    yield* put({
      type: "",
      payload: {
        isMixedWithPredicate: true,
      },
    });
    yield* put({
      type: "action-3",
    });
  }

  const actual: any[] = [];
  function* genFn() {
    yield* spawn(channelFn);

    try {
      actual.push(yield* take("*")); // take all actions
      actual.push(yield* take("action-1")); // take only actions of type 'action-1'
      actual.push(yield* take(["action-2", "action-2222"])); // take either type
      actual.push(yield* take((a: Action) => a.payload?.isAction)); // take if match predicate
      actual.push(
        yield* take([
          "action-3",
          (a: Action) => a.payload?.isMixedWithPredicate,
        ]),
      ); // take if match any from the mixed array
      actual.push(
        yield* take([
          "action-3",
          (a: Action) => a.payload?.isMixedWithPredicate,
        ]),
      ); // take if match any from the mixed array
    } finally {
      actual.push("auto ended");
    }
  }

  await run(genFn);

  const expected = [
    {
      type: "action-*",
    },
    {
      type: "action-1",
    },
    {
      type: "action-2",
    },
    {
      type: "",
      payload: {
        isAction: true,
      },
    },
    {
      type: "",
      payload: {
        isMixedWithPredicate: true,
      },
    },
    {
      type: "action-3",
    },
    "auto ended",
  ];
  expect(actual).toEqual(expected);
});
