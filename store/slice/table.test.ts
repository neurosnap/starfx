import { asserts, describe, it } from "../../test.ts";
import { configureStore, updateStore } from "../../store/mod.ts";
import { createQueryState } from "../../action.ts";

import { createTable } from "./table.ts";

const tests = describe("createTable()");

type TUser = {
  id: number;
  user: string;
};

const NAME = "table";
const empty = { id: 0, user: "" };
const slice = createTable<TUser>({
  name: NAME,
  empty,
});

const initialState = {
  ...createQueryState(),
  [NAME]: slice.initialState,
};

const first = { id: 1, user: "A" };
const second = { id: 2, user: "B" };
const third = { id: 3, user: "C" };

it(tests, "sets up a table", async () => {
  const store = configureStore({
    initialState,
  });

  await store.run(function* () {
    yield* updateStore(slice.set({ [first.id]: first }));
  });
  asserts.assertEquals(store.getState()[NAME], { [first.id]: first });
});

it(tests, "adds a row", async () => {
  const store = configureStore({
    initialState,
  });

  await store.run(function* () {
    yield* updateStore(slice.set({ [second.id]: second }));
  });
  asserts.assertEquals(store.getState()[NAME], { 2: second });
});

it(tests, "removes a row", async () => {
  const store = configureStore({
    initialState: {
      ...initialState,
      [NAME]: { [first.id]: first, [second.id]: second } as Record<
        string,
        TUser
      >,
    },
  });

  await store.run(function* () {
    yield* updateStore(slice.remove(["1"]));
  });
  asserts.assertEquals(store.getState()[NAME], { [second.id]: second });
});

it(tests, "updates a row", async () => {
  const store = configureStore({
    initialState,
  });
  await store.run(function* () {
    const updated = { id: second.id, user: "BB" };
    yield* updateStore(slice.patch({ [updated.id]: updated }));
  });
  asserts.assertEquals(store.getState()[NAME], {
    [second.id]: { ...second, user: "BB" },
  });
});

it(tests, "gets a row", async () => {
  const store = configureStore({
    initialState,
  });
  await store.run(function* () {
    yield* updateStore(
      slice.add({ [first.id]: first, [second.id]: second, [third.id]: third }),
    );
  });

  const row = slice.selectById(store.getState(), { id: "2" });
  asserts.assertEquals(row, second);
});

it(tests, "when the record doesnt exist, it returns empty record", () => {
  const store = configureStore({
    initialState,
  });

  const row = slice.selectById(store.getState(), { id: "2" });
  asserts.assertEquals(row, empty);
});

it(tests, "gets all rows", async () => {
  const store = configureStore({
    initialState,
  });
  const data = { [first.id]: first, [second.id]: second, [third.id]: third };
  await store.run(function* () {
    yield* updateStore(slice.add(data));
  });
  asserts.assertEquals(store.getState()[NAME], data);
});
