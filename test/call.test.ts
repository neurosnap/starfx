import { describe, expect, it } from "../../test/suite.ts";

import { run } from "../deps.ts";
import { call } from "../mod.ts";

describe("call()", () => {
  it("should call the generator function", async () => {
    function* me() {
      return "valid";
    }

    await run(function* () {
      const result = yield* call(me);
      expect(result).toBe("valid");
    });
  });

  it("should call a normal function with no params", async () => {
    function me() {
      return "valid";
    }

    await run(function* () {
      const result = yield* call(me);
      expect(result).toBe("valid");
    });
  });

  it("should call a normal function with params", async () => {
    function me(v: string) {
      return "valid " + v;
    }

    await run(function* () {
      const result = yield* call(() => me("fn"));
      expect(result).toBe("valid fn");
    });
  });

  it("should call a promise", async () => {
    const me = () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve("valid");
        }, 10);
      });

    await run(function* () {
      const result = yield* call(me);
      expect(result).toBe("valid");
    });
  });
});
