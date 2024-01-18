import { describe, expect, it } from "../test.ts";
import {
  call,
  each,
  LogAction,
  LogContext,
  Operation,
  run,
  spawn,
  supervise,
  superviseBackoff,
} from "../mod.ts";

const test = describe("supervise()");

describe("superviseBackoff", () => {
  it("should increase number exponentially", () => {
    const actual: number[] = [];
    for (let i = 1; i < 15; i += 1) {
      actual.push(superviseBackoff(i));
    }
    expect(actual).toEqual([
      20,
      40,
      80,
      160,
      320,
      640,
      1280,
      2560,
      5120,
      10240,
      -1,
      -1,
      -1,
      -1,
    ]);
  });
});

it(test, "should recover with backoff pressure", async () => {
  const err = console.error;
  console.error = () => {};

  const actions: LogAction[] = [];
  const backoff = (attempt: number) => {
    if (attempt === 4) return -1;
    return attempt;
  };

  await run(function* () {
    function* op(): Operation<void> {
      throw new Error("boom!");
    }
    yield* spawn(function* () {
      const chan = yield* LogContext;
      for (const action of yield* each(chan)) {
        actions.push(action);
        yield* each.next();
      }
    });
    yield* call(supervise(op, backoff));
  });

  expect(actions.length).toEqual(3);
  expect(actions[0].type).toEqual("error:supervise");
  expect(actions[0].payload.message).toEqual(
    "Exception caught, waiting 1ms before restarting operation",
  );
  expect(actions[1].type).toEqual("error:supervise");
  expect(actions[1].payload.message).toEqual(
    "Exception caught, waiting 2ms before restarting operation",
  );
  expect(actions[2].type).toEqual("error:supervise");
  expect(actions[2].payload.message).toEqual(
    "Exception caught, waiting 3ms before restarting operation",
  );

  console.error = err;
});
