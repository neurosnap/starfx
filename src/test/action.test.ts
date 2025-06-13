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

test("createAction with object type should be compatible with UnknownAction", () => {
  expect.assertions(1);
  const emptyAction = createAction<object>("EMPTY_ACTION");
  const action = emptyAction({});

  // This should compile without TypeScript errors - testing the index signature
  const hasIndexSignature = (action as any).someRandomProperty === undefined;
  expect(hasIndexSignature).toBe(true);
});
