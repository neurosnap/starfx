import { describe, expect, it } from "../test.ts";
import type { Result } from "../deps.ts";
import { Ok, run, sleep } from "../deps.ts";
import { parallel } from "../fx/mod.ts";
import { cforEach } from "../iter.ts";

const test = describe("parallel()");

it(
  test,
  "should return an immediate channel with results as they are completed",
  async () => {
    const result = await run(function* () {
      const { wait, immediate } = yield* parallel([
        function* () {
          yield* sleep(20);
          return "second";
        },
        function* () {
          yield* sleep(10);
          return "first";
        },
      ]);

      const res: Result<string>[] = [];
      yield* cforEach(immediate, function* (val) {
        res.push(val);
      });

      yield* wait();
      return res;
    });

    expect(result).toEqual([Ok("first"), Ok("second")]);
  },
);

it(
  test,
  "should return a sequence channel with results preserving array order as results",
  async () => {
    const result = await run(function* () {
      const { wait, sequence } = yield* parallel([
        function* () {
          yield* sleep(20);
          return "second";
        },
        function* () {
          yield* sleep(10);
          return "first";
        },
      ]);

      const res: Result<string>[] = [];
      yield* cforEach(sequence, function* (val) {
        res.push(val);
      });

      yield* wait();
      return res;
    });

    expect(result).toEqual([Ok("second"), Ok("first")]);
  },
);

it(
  test,
  "should return all the result in an array, preserving order",
  async () => {
    const result = await run(function* () {
      const { wait } = yield* parallel([
        function* () {
          yield* sleep(20);
          return "second";
        },
        function* () {
          yield* sleep(10);
          return "first";
        },
      ]);

      return yield* wait();
    });

    expect(result).toEqual([Ok("second"), Ok("first")]);
  },
);
