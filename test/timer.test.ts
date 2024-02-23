import { describe, expect, it } from "../test.ts";
import { clearTimers, put, run, sleep, spawn, timer } from "../mod.ts";

const tests = describe("timer()");

it(tests, "should call thunk at most once every timer", async () => {
  let called = 0;
  await run(function* () {
    yield* spawn(function* () {
      yield* timer(10)("ACTION", function* () {
        called += 1;
      });
    });
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* sleep(1);
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* sleep(20);
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* sleep(50);
  });
  expect(called).toBe(2);
});

it(tests, "should let user cancel timer", async () => {
  let called = 0;
  await run(function* () {
    yield* spawn(function* () {
      yield* timer(10_000)("ACTION", function* () {
        called += 1;
      });
    });
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* sleep(1);
    yield* put(clearTimers(["my-key"]));
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
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
    yield* spawn(function* () {
      yield* timer(10_000)("WOW", function* () {
        called += 1;
      });
    });
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* put({ type: "WOW", payload: { key: "my-key" } });
    yield* sleep(1);
    yield* put(clearTimers(["*"]));
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* put({ type: "WOW", payload: { key: "my-key" } });
  });
  expect(called).toBe(4);
});
