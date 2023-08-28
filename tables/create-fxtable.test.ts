import { asserts, describe, it } from "../test.ts";
import { configureStore } from "../store/store.ts";
import { createQueryState } from "../action.ts";
import { fxCreateTable } from "./create-fxtable.ts";
import { parallel } from "../mod.ts";
import { setGlobalStore, tablesTakeEvery } from "./action-map.ts";
import { sleep } from "../test.ts";

import type { MapEntity, Operation } from "../deps.ts";
import type { ParallelRet } from "../fx/parallel.ts";
import type { RootState } from "../types.ts";

const tests = describe("fxCreateTable()");

type TUser = {
  id: number;
  user: string;
};

const tab00 = fxCreateTable({
  name: "table00",
  initialState: {} as MapEntity<TUser>, //'0':  { id:0,  user: "" }
});

const initialState = createQueryState({
  [tab00.name]: tab00.initialState,
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

const first = { id: 1, user: "A" };
const second = { id: 2, user: "B" };
const third = { id: 3, user: "C" };
const mapRecords = (data: TUser[]) =>
  data.reduce(
    (acc, cur) => ({ ...acc, [cur.id]: cur }),
    {} as MapEntity<TUser>,
  );
it(tests, "sets up a table", async () => {
  setGlobalStore(store);
  runState();
  // set

  store.dispatch(tab00.actions.set(mapRecords([first])));
  await sleep(150);
  asserts.assertEquals(store.getState()[tab00.name], { 1: first });
});
it(tests, "adds a row", async () => {
  store.dispatch(tab00.actions.add(mapRecords([second])));
  await sleep(150);
  asserts.assertEquals(store.getState()[tab00.name], { 1: first, 2: second });
});

it(tests, "removes a row", async () => {
  store.dispatch(tab00.actions.remove(["1"]));
  await sleep(150);
  asserts.assertEquals(store.getState()[tab00.name], { 2: second });
});

it(tests, "updates a row", async () => {
  const updated = { ...second, user: "BB" };
  store.dispatch(tab00.actions.patch({ 2: updated }));
  await sleep(150);
  asserts.assertEquals(store.getState()[tab00.name], { 2: updated });
});

it(tests, "gets a row", async () => {
  const updated = { ...second, user: "BB" };
  const row = tab00.selectors.selectByKey(store.getState(), "2");
  await sleep(10);
  asserts.assertEquals(row, updated);
});

it(tests, "gets all rows", async () => {
  const updated = { ...second, user: "BB" };
  const allRows = tab00.selectors.selectTable(store.getState());
  await sleep(10);
  asserts.assertEquals(allRows, { 2: updated });
});

it(tests, "sets a dataset", async () => {
  store.dispatch(tab00.actions.set(mapRecords([first, second, third])));
  await sleep(10);
  const allRows = tab00.selectors.selectTable(store.getState());
  asserts.assertEquals(allRows, { 1: first, 2: second, 3: third });
});
