import { createAction } from "../index.js";
import { expect, test } from "../test.js";

test("should return action type when stringified", () => {
  const undo = createAction("UNDO");
  expect("UNDO").toEqual(`${undo}`);
});

test("return object with type", () => {
  const undo = createAction("UNDO");
  expect(undo()).toEqual({ type: "UNDO", payload: undefined });
});
