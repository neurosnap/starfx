import { updateStore } from "../../../store/fx.js";
import { createTable, table } from "../../../store/slice/table.js";
import { configureStore } from "../../../store/store.js";
import { expect, test } from "../../../test.js";

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

test("sets up a table", async () => {
  const store = configureStore({
    initialState,
  });

  await store.run(function* () {
    yield* updateStore(slice.set({ [first.id]: first }));
  });
  expect(store.getState()[NAME]).toEqual({ [first.id]: first });
});

test("adds a row", async () => {
  const store = configureStore({
    initialState,
  });

  await store.run(function* () {
    yield* updateStore(slice.set({ [second.id]: second }));
  });
  expect(store.getState()[NAME]).toEqual({ 2: second });
});

test("removes a row", async () => {
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
  expect(store.getState()[NAME]).toEqual({ [second.id]: second });
});

test("updates a row", async () => {
  const store = configureStore({
    initialState,
  });
  await store.run(function* () {
    const updated = { id: second.id, user: "BB" };
    yield* updateStore(slice.patch({ [updated.id]: updated }));
  });
  expect(store.getState()[NAME]).toEqual({
    [second.id]: { ...second, user: "BB" },
  });
});

test("gets a row", async () => {
  const store = configureStore({
    initialState,
  });
  await store.run(function* () {
    yield* updateStore(
      slice.add({ [first.id]: first, [second.id]: second, [third.id]: third }),
    );
  });

  const row = slice.selectById(store.getState(), { id: "2" });
  expect(row).toEqual(second);
});

test("when the record doesnt exist, it returns empty record", () => {
  const store = configureStore({
    initialState,
  });

  const row = slice.selectById(store.getState(), { id: "2" });
  expect(row).toEqual(empty);
});

test("gets all rows", async () => {
  const store = configureStore({
    initialState,
  });
  const data = { [first.id]: first, [second.id]: second, [third.id]: third };
  await store.run(function* () {
    yield* updateStore(slice.add(data));
  });
  expect(store.getState()[NAME]).toEqual(data);
});

// checking types of `result` here
test("with empty", async () => {
  const tbl = table<TUser>({ empty: first })("users");
  const store = configureStore({
    initialState,
  });

  expect(tbl.empty).toEqual(first);
  await store.run(function* () {
    yield* updateStore(tbl.set({ [first.id]: first }));
  });
  expect(tbl.selectTable(store.getState())).toEqual({
    [first.id]: first,
  });
  const result = tbl.selectById(store.getState(), { id: 1 });
  expect(result).toEqual(first);
});

// checking types of `result` here
test("with no empty", async () => {
  const tbl = table<TUser>()("users");
  const store = configureStore({
    initialState,
  });

  expect(tbl.empty).toEqual(undefined);
  await store.run(function* () {
    yield* updateStore(tbl.set({ [first.id]: first }));
  });
  expect(tbl.selectTable(store.getState())).toEqual({
    [first.id]: first,
  });
  const result = tbl.selectById(store.getState(), { id: 1 });
  expect(result).toEqual(first);
});
