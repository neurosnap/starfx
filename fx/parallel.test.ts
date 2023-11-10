import { describe, expect, it } from "../test.ts";
import type { Operation, Result } from "../deps.ts";
import { each, Err, Ok, run, sleep, spawn } from "../deps.ts";

import { parallel } from "./parallel.ts";

const test = describe("parallel()");

interface Defer<T> {
  promise: Promise<T>;
  resolve: (t: T) => void;
  reject: (t: Error) => void;
}

function defer<T>(): Defer<T> {
  let resolve: (t: T) => void = () => {};
  let reject: (t: Error) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { resolve, reject, promise };
}

it(
  test,
  "should return an immediate channel with results as they are completed",
  async () => {
    const result = await run(function* () {
      const results = yield* parallel([
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
      for (const val of yield* each(results.immediate)) {
        res.push(val);
        yield* each.next();
      }

      yield* results;
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
      const results = yield* parallel([
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
      for (const val of yield* each(results.sequence)) {
        res.push(val);
        yield* each.next();
      }

      yield* results;
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
      const para = yield* parallel([
        function* () {
          yield* sleep(20);
          return "second";
        },
        function* () {
          yield* sleep(10);
          return "first";
        },
      ]);

      return yield* para;
    });

    expect(result).toEqual([Ok("second"), Ok("first")]);
  },
);

it(test, "should return empty array", async () => {
  let actual;
  await run(function* (): Operation<void> {
    const results = yield* parallel([]);
    actual = yield* results;
  });
  expect(actual).toEqual([]);
});

it(test, "should resolve all async items", async () => {
  const two = defer();

  function* one() {
    yield* sleep(5);
    return 1;
  }

  const result = await run(function* () {
    yield* spawn(function* () {
      yield* sleep(15);
      two.resolve(2);
    });
    const results = yield* parallel([one, () => two.promise]);
    return yield* results;
  });

  expect(result).toEqual([Ok(1), Ok(2)]);
});

it(test, "should stop all operations when there is an error", async () => {
  let actual: Result<number>[] = [];
  const one = defer<number>();
  const two = defer<number>();

  function* genFn() {
    try {
      const results = yield* parallel([() => one.promise, () => two.promise]);
      actual = yield* results;
    } catch (_) {
      actual = [Err(new Error("should not get hit"))];
    }
  }

  const err = new Error("error");
  one.reject(err);
  two.resolve(1);

  await run(genFn);

  const expected = [Err(err), Ok(1)];
  expect(actual).toEqual(expected);
});
