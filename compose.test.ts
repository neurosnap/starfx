import { describe, expect, it } from "./test.ts";

import { Ok, run, sleep } from "./deps.ts";
import { compose } from "./compose.ts";

const tests = describe("compose()");

it(tests, "should compose middleware", async () => {
  const mdw = compose<{ one: string; three: string }>([
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
    return yield* mdw({ one: "", three: "" });
  });

  const expected = Ok({
    // we should see the mutation
    one: "two",
    three: "four",
  });
  expect(actual).toEqual(expected);
});

it(tests, "order of execution", async () => {
  const mdw = compose<{ actual: string }>([
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
    return yield* mdw({ actual: "" });
  });
  const expected = Ok({ actual: "abcdefg" });
  expect(actual).toEqual(expected);
});
