import { describe, expect, it } from "../test.ts";
import {
  call,
  clearTimers,
  keepAlive,
  put,
  run,
  sleep,
  spawn,
  timer,
} from "../mod.ts";

const tests = describe("timer()");

it(tests, "should call thunk at most once every timer", async () => {
  let called = 0;
  await run(function* () {
    yield* spawn(function* () {
      yield* timer(10)("ACTION1", function* () {
        called += 1;
      });
    });
    yield* put({ type: "ACTION1", payload: { key: "my-key" } });
    yield* sleep(1);
    yield* put({ type: "ACTION1", payload: { key: "my-key" } });
    yield* sleep(20);
    yield* put({ type: "ACTION1", payload: { key: "my-key" } });
    yield* sleep(50);
  });

  expect(called).toBe(2);
});

it(tests, "should let user cancel timer", async () => {
  let called = 0;

  await run(function* () {
    yield* spawn(function* () {
      yield* timer(10_000)("ACTION2", function* () {
        called += 1;
        return called;
      });
    });
    yield* sleep(100);

    yield* put({ type: "ACTION2", payload: { key: "my-key", id: 1 } }); /// id for debugging
    yield* sleep(1);
    yield* put({ type: `${clearTimers}`, payload: "my-key" });
    yield* sleep(1);
    yield* put({ type: "ACTION2", payload: { key: "my-key", id: 3 } }); // id for debugging
    yield* sleep(100);
  });
  expect(called).toBe(2);
});

it(tests, "should let user cancel timer with action obj", async () => {
  let called = 0;
  await run(function* () {
    yield* spawn(function* () {
      yield* timer(10_000)("ACTION", function* (u) {
        called += 1;
      });
    });
    yield* sleep(100);
    const action = { type: "ACTION", payload: { key: "my-key" } };
    yield* put(action);
    yield* sleep(1);
    yield* put(clearTimers(action));
    yield* put(action);
    yield* sleep(100);
  });
  expect(called).toBe(2);
});

it(tests, "should let user cancel timer with wildcard", async () => {
  let called = 0;
  await run(function* () {
    yield* spawn(function* () {
      yield* timer(10_000)("ACTION", function* () {
        called += 1;
      });
    });
    yield* sleep(100);
    yield* spawn(function* () {
      yield* timer(10_000)("WOW", function* () {
        called += 1;
      });
    });
    yield* sleep(100);
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* put({ type: "WOW", payload: { key: "my-key" } });
    yield* sleep(1);
    yield* put(clearTimers(["*"]));
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* put({ type: "WOW", payload: { key: "my-key" } });
    yield* sleep(100);
  });
  expect(called).toBe(4);
});
