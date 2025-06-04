import { Err, Ok, type Result, compose, run, safe, sleep } from "../mod.js";
import { asserts, describe, expect, it } from "../test.js";

const tests = describe("compose()");

it(tests, "should compose middleware", async () => {
  const mdw = compose<{ one: string; three: string; result: Result<void> }>([
    function* (ctx, next) {
      ctx.one = "two";
      yield* next();
    },
    function* (ctx, next) {
      ctx.three = "four";
      yield* next();
    },
  ]);
  const actual = await run(function* () {
    const ctx = { one: "", three: "", result: Ok(void 0) };
    yield* mdw(ctx);
    return ctx;
  });

  const expected = {
    // we should see the mutation
    one: "two",
    three: "four",
    result: Ok(void 0),
  };
  expect(actual).toEqual(expected);
});

it(tests, "order of execution", async () => {
  const mdw = compose<{ actual: string; result: Result<void> }>([
    function* (ctx, next) {
      ctx.actual += "a";
      yield* next();
      ctx.actual += "g";
    },
    function* (ctx, next) {
      yield* sleep(10);
      ctx.actual += "b";
      yield* next();
      yield* sleep(10);
      ctx.actual += "f";
    },
    function* (ctx, next) {
      ctx.actual += "c";
      yield* next();
      ctx.actual += "d";
      yield* sleep(30);
      ctx.actual += "e";
    },
  ]);

  const actual = await run(function* () {
    const ctx = { actual: "", result: Ok(void 0) };
    yield* mdw(ctx);
    return ctx;
  });
  const expected = {
    actual: "abcdefg",
    result: Ok(void 0),
  };
  expect(actual).toEqual(expected);
});

it(tests, "when error is discovered, it should throw", async () => {
  const err = new Error("boom");
  const mdw = compose([
    function* (_, next) {
      yield* next();
      asserts.fail();
    },
    function* (_, next) {
      yield* next();
      throw err;
    },
  ]);
  const actual = await run(function* () {
    const ctx = {};
    const result = yield* safe(() => mdw(ctx));
    return result;
  });

  const expected = Err(err);
  expect(actual).toEqual(expected);
});
