import { describe, expect, it } from "../test.ts";
import { API_ACTION_PREFIX, createAction } from "../mod.ts";

const tests = describe("createAction()");

it(tests, "should return action type when stringified", () => {
  const undo = createAction("UNDO");
  expect(`${API_ACTION_PREFIX}:UNDO`).toEqual(`${undo}`);
});

it(tests, "return object with type", () => {
  const undo = createAction("UNDO");
  expect(undo()).toEqual({ type: `${API_ACTION_PREFIX}:UNDO` });
});
