import { asserts, describe, it } from "../test.ts";
import { configureStore } from "../store/store.ts";
import { updateStore } from "../store/mod.ts";

import { createAssign } from "./create-assign.ts";

const tests = describe("createAssign()");

const NAME = "numberType";
const slice = createAssign({
  name: NAME,
  initialState: 0,
});

it(tests, "sets up set", async () => {
  const store = configureStore({
    initialState: {
      [NAME]: slice.initialState,
    },
  });
  await store.run(function* () {
    yield* updateStore(
      slice.actions.set(2),
    );
  });
  asserts.assertEquals(store.getState()[NAME], 2);
});

it(tests, "reset", async () => {
  const store = configureStore({
    initialState: {
      [NAME]: 2,
    },
  });
  await store.run(function* () {
    yield* updateStore(
      slice.actions.reset(),
    );
  });
  asserts.assertEquals(store.getState()[NAME], 0);
});
