import { asserts, describe, it } from "../../test.ts";
import { configureStore } from "../store.ts";
import { updateStore } from "../fx.ts";
import { createTable, table } from "./table.ts";
import { call } from "../../mod.ts";

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
  [NAME]: slice.initialState,
};

const first = { id: 1, user: "A" };
const second = { id: 2, user: "B" };
const third = { id: 3, user: "C" };

it(tests, "sets up a table", async () => {
  const store = configureStore({
    initialState,
  });

  await store.run(updateStore(slice.set({ [first.id]: first })));
  asserts.assertEquals(store.getState()[NAME], { [first.id]: first });
});

it(tests, "adds a row", async () => {
  const store = configureStore({
    initialState,
  });

  await store.run(updateStore(slice.set({ [second.id]: second })));
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

  await store.run(updateStore(slice.remove(["1"])));
  asserts.assertEquals(store.getState()[NAME], { [second.id]: second });
});

it(tests, "updates a row", async () => {
  const store = configureStore({
    initialState,
  });
  await store.run(call(function* () {
    const updated = { id: second.id, user: "BB" };
    yield* updateStore(slice.patch({ [updated.id]: updated }));
  }));
  asserts.assertEquals(store.getState()[NAME], {
    [second.id]: { ...second, user: "BB" },
  });
});

it(tests, "gets a row", async () => {
  const store = configureStore({
    initialState,
  });
  await store.run(updateStore(
    slice.add({ [first.id]: first, [second.id]: second, [third.id]: third }),
  ));

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
  await store.run(updateStore(slice.add(data)));
  asserts.assertEquals(store.getState()[NAME], data);
});

// checking types of `result` here
it(tests, "with empty", async () => {
  const tbl = table<TUser>({ empty: first })("users");
  const store = configureStore({
    initialState,
  });

  asserts.assertEquals(tbl.empty, first);
  await store.run(updateStore(tbl.set({ [first.id]: first })));
  asserts.assertEquals(tbl.selectTable(store.getState()), {
    [first.id]: first,
  });
  const result = tbl.selectById(store.getState(), { id: 1 });
  asserts.assertEquals(result, first);
});

// checking types of `result` here
it(tests, "with no empty", async () => {
  const tbl = table<TUser>()("users");
  const store = configureStore({
    initialState,
  });

  asserts.assertEquals(tbl.empty, undefined);
  await store.run(updateStore(tbl.set({ [first.id]: first })));
  asserts.assertEquals(tbl.selectTable(store.getState()), {
    [first.id]: first,
  });
  const result = tbl.selectById(store.getState(), { id: 1 });
  asserts.assertEquals(result, first);
});
