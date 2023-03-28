import { createFuture, run, sleep, spawn } from "../deps.ts";
import { describe, expect, it } from "../../test/suite.ts";

import { all } from "../mod.ts";

describe("all()", () => {
  it("should return empty array", async () => {
    let actual;
    await run(function* () {
      actual = yield* all([]);
    });
    expect(actual).toEqual([]);
  });

  it("should resolve all async items", async () => {
    const two = createFuture<number>();

    function* one() {
      yield* sleep(5);
      return 1;
    }

    const result = await run(function* () {
      yield* spawn(function* () {
        yield* sleep(15);
        two.resolve(2);
      });
      return yield* all([one, () => two.future]);
    });

    expect(result).toEqual([1, 2]);
  });

  it("should stop all operations when there is an error", async () => {
    let actual: number[] = [];
    const one = createFuture<number>();
    const two = createFuture<number>();

    function* genFn() {
      try {
        actual = yield* all([() => one.future, () => two.future]);
      } catch (err) {
        actual = [err];
      }
    }

    one.reject(new Error("error"));
    two.resolve(1);

    await run(genFn);

    const expected = [new Error("error")];
    expect(actual).toEqual(expected);
  });
});
