import { asserts, describe, it } from "../test.ts";
import { configureStore, updateStore } from "../store/mod.ts";
import { createQueryState } from "../action.ts";

import { fxCreateTable } from "./create-table.ts";

const tests = describe("createTable()");

type TUser = {
  id: number;
  user: string;
};

const NAME = "table";
const slice = fxCreateTable<TUser>({
  name: NAME,
});

const initialState = {
  ...createQueryState(),
  [NAME]: slice.initialState,
};

const first = { id: 1, user: "A" };
const second = { id: 2, user: "B" };
const third = { id: 3, user: "C" };
const mapRecords = (data: TUser[]) =>
  data.reduce<Record<string, TUser>>(
    (acc, cur) => ({ ...acc, [cur.id]: cur }),
    {},
  );

it(tests, "sets up a table", async () => {
  const store = configureStore({
    initialState,
  });

  await store.run(function* () {
    yield* updateStore(slice.actions.set(mapRecords([first])));
  });
  asserts.assertEquals(store.getState()[NAME], { 1: first });
});

it(tests, "adds a row", async () => {
  const store = configureStore({
    initialState,
  });

  await store.run(function* () {
    yield* updateStore(slice.actions.set(mapRecords([second])));
  });
  asserts.assertEquals(store.getState()[NAME], { 2: second });
});

it(tests, "removes a row", async () => {
  const store = configureStore({
    initialState: {
      ...initialState,
      [NAME]: { "1": first, "2": second } as Record<string, TUser>,
    },
  });

  await store.run(function* () {
    yield* updateStore(slice.actions.remove(["1"]));
  });
  asserts.assertEquals(store.getState()[NAME], { "2": second });
});

it(tests, "updates a row", async () => {
  const store = configureStore({
    initialState,
  });
  await store.run(function* () {
    const updated = { id: second.id, user: "BB" };
    yield* updateStore(slice.actions.patch({ 2: updated }));
  });
  asserts.assertEquals(store.getState()[NAME], {
    2: { ...second, user: "BB" },
  });
});

it(tests, "gets a row", async () => {
  const store = configureStore({
    initialState,
  });
  await store.run(function* () {
    yield* updateStore(slice.actions.add({ 1: first, 2: second, 3: third }));
  });

  const row = slice.selectors.selectById(store.getState(), { id: "2" });
  asserts.assertEquals(row, second);
});

it(tests, "gets all rows", async () => {
  const store = configureStore({
    initialState,
  });
  const data = { 1: first, 2: second, 3: third };
  await store.run(function* () {
    yield* updateStore(slice.actions.add(data));
  });
  asserts.assertEquals(store.getState()[NAME], data);
});
