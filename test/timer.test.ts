import { describe, expect, it } from "../test.ts";
import {
  clearTimers,
  put,
  run,
  sleep,
  spawn,
  timer,
  timer__0,
} from "../mod.ts";

const tests = describe("timer()");

it(tests, "should call thunk at most once every timer", async () => {
  let called = 0;
  await run(function* () {
    yield* spawn(function* () {
      yield* timer__0(10)("ACTION1", function* () {
        called += 1;
      });
    });
    yield* put({ type: "ACTION1", payload: { key: "my-key", id: 1 } });
    yield* sleep(1);
    yield* put({ type: "ACTION1", payload: { key: "my-key", id: 2 } });
    yield* sleep(20);
    yield* put({ type: "ACTION1", payload: { key: "my-key", id: 3 } });
    yield* sleep(50);
    yield* sleep(250);
  });

  expect(called).toBe(2);
});

it(tests, "should let user cancel timer", async () => {
  let called = 0;

  await run(function* () {
    yield* spawn(function* () {
      yield* timer__0(10_000)("ACTION2", function* () {
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
      yield* timer__0(10_000)("ACTION", function* () {
        called += 1;
      });
    });
    // TODO upgrade to future version, see issue https://github.com/thefrontside/effection/issues/998
    // we currently process functions in sibiling spawn()
    // as last in, first out for this case but if there is async work,
    //  such as sleep, it breaks that queue into two which makes this work as expected
    yield* sleep(0);
    const task = yield* spawn(function* () {
      const action = { type: "ACTION", payload: { key: "my-key" } };
      yield* put(action);
      yield* sleep(0);
      yield* put(clearTimers(action));
      yield* sleep(0);
      yield* put(action);
      yield* sleep(0);
    });
    yield* task;
  });
  // clearing the timer allows a second call to go out
  //  as it avoids the no-op for the cache check
  expect(called).toBe(2);
});

it(tests, "should let user cancel timer with wildcard", async () => {
  let called = 0;
  await run(function* () {
    yield* spawn(function* () {
      yield* timer__0(10_000)("ACTION", function* () {
        called += 1;
      });
    });
    yield* sleep(0);
    yield* spawn(function* () {
      yield* timer__0(10_000)("WOW", function* () {
        called += 1;
      });
    });
    // TODO upgrade to future version, see issue https://github.com/thefrontside/effection/issues/998
    // we currently process functions in sibiling spawn()
    // as last in, first out for this case but if there is async work,
    //  such as sleep, it breaks that queue into two which makes this work as expected
    yield* sleep(0);
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* put({ type: "WOW", payload: { key: "my-key" } });
    yield* sleep(0);
    yield* put(clearTimers(["*"]));
    yield* sleep(0);
    yield* put({ type: "ACTION", payload: { key: "my-key" } });
    yield* put({ type: "WOW", payload: { key: "my-key" } });
    yield* sleep(0);
  });
  // clearing the timer allows a second call to go out
  //  as it avoids the no-op for the cache check
  expect(called).toBe(4);
});
