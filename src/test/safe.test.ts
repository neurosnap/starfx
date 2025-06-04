import { call, run } from "../mod.js";
import { describe, expect, it } from "../test.js";

const tests = describe("call()");

it(tests, "should call the generator function", async () => {
  expect.assertions(1);
  function* me() {
    return "valid";
  }

  await run(function* () {
    const result = yield* call(me);
    expect(result).toBe("valid");
  });
});

it(tests, "should return an Err()", async () => {
  expect.assertions(1);
  const err = new Error("bang!");
  function* me() {
    throw err;
  }

  await run(function* () {
    try {
      yield* call(me);
    } catch (err) {
      expect(err).toEqual(err);
    }
  });
});

it(tests, "should call a promise", async () => {
  expect.assertions(1);
  const me = () =>
    new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve("valid");
      }, 10);
    });

  await run(function* () {
    const result = yield* call(me);
    expect(result).toEqual("valid");
  });
});
