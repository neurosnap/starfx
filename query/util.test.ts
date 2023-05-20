import { describe, expect, it } from "../test.ts";

import { createAction } from "./util.ts";
import { API_ACTION_PREFIX } from "./constant.ts";

const tests = describe("createAction()");

it(tests, "should return action type when stringified", () => {
  const undo = createAction("UNDO");
  expect(`${API_ACTION_PREFIX}/UNDO`).toEqual(`${undo}`);
});

it(tests, "return object with type", () => {
  const undo = createAction("UNDO");
  expect(undo()).toEqual({ type: `${API_ACTION_PREFIX}/UNDO` });
});
