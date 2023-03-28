import { Operation, run, sleep, spawn } from "../deps.ts";
import { describe, expect, it } from "../test.ts";

import { all } from "../mod.ts";

interface Defer<T> {
  promise: Operation<T>;
  resolve: (t: T) => void;
  reject: (t: Error) => void;
}

function defer<T>(): Defer<T> {
  let resolve;
  let reject;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { resolve, reject, promise } as any;
}

describe("all()", () => {
  it("should return empty array", async () => {
    let actual;
    await run(function* () {
      actual = yield* all([]);
    });
    expect(actual).toEqual([]);
  });

  it("should resolve all async items", async () => {
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
      return yield* all([one, () => two.promise]);
    });

    expect(result).toEqual([1, 2]);
  });

  it("should stop all operations when there is an error", async () => {
    let actual: number[] = [];
    const one = defer<number>();
    const two = defer<number>();

    function* genFn() {
      try {
        actual = yield* all([() => one.promise, () => two.promise]);
      } catch (err) {
        actual = [err];
      }
    }

    const err = new Error("error");
    one.reject(err);
    two.resolve(1);

    await run(genFn);

    const expected = [err];
    expect(actual).toEqual(expected);
  });
});
