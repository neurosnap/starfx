import { call, run } from "../index.js";
import { expect, test } from "../test.js";

test("should call the generator function", async () => {
  expect.assertions(1);
  function* me() {
    return "valid";
  }

  await run(function* () {
    const result = yield* call(me);
    expect(result).toBe("valid");
  });
});

test("should return an Err()", async () => {
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

test("should call a promise", async () => {
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
