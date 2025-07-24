import { clearTimers, put, run, sleep, spawn, timer } from "../index.js";
import { expect, test } from "../test.js";

test("should call thunk at most once every timer", async () => {
  expect.assertions(1);
  let called = 0;
  await run(function* () {
    yield* spawn(function* () {
      yield* timer(10)("ACTION", function* () {
        called += 1;
      });
    });
    yield* sleep(1);
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* sleep(1);
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* sleep(20);
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* sleep(50);
  });
  expect(called).toBe(2);
});

test("should let user cancel timer", async () => {
  expect.assertions(1);
  let called = 0;
  await run(function* () {
    yield* spawn(function* () {
      yield* timer(10_000)("ACTION", function* () {
        called += 1;
      });
    });
    yield* sleep(1);
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* sleep(1);
    yield* put(clearTimers(["my-key"]));
    yield* sleep(1);
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* sleep(1);
  });
  expect(called).toBe(2);
});

test("should let user cancel timer with action obj", async () => {
  expect.assertions(1);
  let called = 0;
  await run(function* () {
    yield* spawn(function* () {
      yield* timer(10_000)("ACTION", function* () {
        called += 1;
      });
    });
    yield* sleep(1);
    const action = { type: "ACTION", payload: { key: "my-key" } };
    yield* put(action);
    yield* sleep(1);
    yield* put(clearTimers(action));
    yield* sleep(1);
    yield* put(action);
    yield* sleep(1);
  });
  expect(called).toBe(2);
});

test("should let user cancel timer with wildcard", async () => {
  expect.assertions(1);
  let called = 0;
  await run(function* () {
    yield* spawn(function* () {
      yield* timer(10_000)("ACTION", function* () {
        called += 1;
      });
    });
    yield* sleep(1);
    yield* spawn(function* () {
      yield* timer(10_000)("WOW", function* () {
        called += 1;
      });
    });
    yield* sleep(1);
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* put({ type: "WOW", payload: { key: "my-key" } });
    yield* sleep(1);
    yield* put(clearTimers(["*"]));
    yield* sleep(1);
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* put({ type: "WOW", payload: { key: "my-key" } });
    yield* sleep(1);
  });
  expect(called).toBe(4);
});
