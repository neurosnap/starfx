import { describe, expect, it } from "./test.ts";

import { Ok, Result, run, sleep } from "./deps.ts";
import { compose } from "./compose.ts";

const tests = describe("compose()");

it(tests, "should compose middleware", async () => {
  const mdw = compose<{ one: string; three: string; result: Result<any[]> }>([
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
    const ctx = { one: "", three: "", result: Ok([]) };
    yield* mdw(ctx);
    return ctx;
  });

  const expected = {
    // we should see the mutation
    one: "two",
    three: "four",
    result: Ok([undefined, undefined]),
  };
  expect(actual).toEqual(expected);
});

it(tests, "order of execution", async () => {
  const mdw = compose<{ actual: string; result: Result<any[]> }>([
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
    const ctx = { actual: "", result: Ok([]) };
    yield* mdw(ctx);
    return ctx;
  });
  const expected = {
    actual: "abcdefg",
    result: Ok([undefined, undefined, undefined]),
  };
  expect(actual).toEqual(expected);
});
