import { asserts, describe, it } from "../test.ts";
import { configureStore } from "../store/store.ts";
import { createQueryState } from "../action.ts";
import { fxCreateAssign } from "./create-fxassign.ts";
import { parallel } from "../mod.ts";
import { setGlobalStore, tablesTakeEvery } from "./action-map.ts";
import { sleep } from "../test.ts";

import type { Operation } from "../deps.ts";
import type { ParallelRet } from "../fx/parallel.ts";
import type { RootState } from "../types.ts";

const tests = describe("fxCreateAssign()");

const ass_00 = fxCreateAssign({
  name: "assign00",
  initialState: { user: "A" },
});
const initialState = createQueryState({
  [ass_00.name]: ass_00.initialState,
}) as RootState;
const store = await configureStore({
  initialState,
});

const runState = () =>
  store.run(function* () {
    const engine = yield* parallel([
      function* () {
        yield* tablesTakeEvery();
      },
    ]) as ParallelRet<Operation<unknown>>;
    yield* engine;
  });

it(tests, "sets up a state, with an assign sets/resets ", async () => {
  setGlobalStore(store);
  runState();
  // set
  store.dispatch(ass_00.actions.set({ user: "B" }));
  await sleep(150);
  asserts.assertEquals(store.getState()[ass_00.name], { user: "B" });
  // reset
  store.dispatch(ass_00.actions.reset());
  await sleep(150);
  asserts.assertEquals(store.getState()[ass_00.name], { user: "A" });
  await sleep(150);
  store.dispatch(ass_00.actions.set({ user: "C" }));
  //knows initial state
  const is = store.getInitialState()[ass_00.name];
  asserts.assertEquals(is, { user: "A" });
  //knows current state
  asserts.assertEquals(store.getState()[ass_00.name], { user: "C" });
  // this tests errors too if is wrong:
  // asserts.assertNotEquals(store.getState()[ass_00.name], { user: "C" })
});
