import { describe, expect, it } from "../test.ts";
import { run } from "../deps.ts";

import { call } from "./call.ts";

const tests = describe("call()");

it(tests, "should call the generator function", async () => {
  function me() {
    return "valid";
  }

  await run(function* () {
    const result = yield* call(me);
    expect(result).toBe("valid");
  });
});

it(tests, "should return an Err()", async () => {
  const err = new Error("bang!");
  function me() {
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

it(tests, "should call a normal function with no params", async () => {
  function me() {
    return "valid";
  }

  await run(function* () {
    const result = yield* call(me);
    expect(result).toEqual("valid");
  });
});

it(tests, "should call a normal function with params", async () => {
  function me(v: string) {
    return "valid " + v;
  }

  await run(function* () {
    const result = yield* call(() => me("fn"));
    expect(result).toEqual("valid fn");
  });
});

it(tests, "should call a promise", async () => {
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
