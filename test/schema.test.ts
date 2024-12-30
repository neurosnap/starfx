import { describe, expect, it } from "../test.ts";
import { createSchema, createStore, select, slice } from "../store/mod.ts";

const tests = describe("createSchema()");

interface User {
  id: string;
  name: string;
}
interface UserWithRoles extends User {
  roles: string[];
}

const emptyUser = { id: "", name: "" };

it(tests, "default schema", async () => {
  const [schema, initialState] = createSchema();
  const store = createStore({ initialState });
  expect(store.getState()).toEqual({
    cache: {},
    loaders: {},
  });

  await store.run(function* () {
    yield* schema.update(schema.loaders.start({ id: "1" }));
    yield* schema.update(schema.cache.add({ "1": true }));
  });

  expect(schema.cache.selectTable(store.getState())).toEqual({
    "1": true,
  });
  expect(
    schema.loaders.selectById(store.getState(), { id: "1" }).status,
    "loading",
  );
});

it(tests, "general types and functionality", async () => {
  expect.assertions(8);
  const [db, initialState] = createSchema({
    users: slice.table<User>({
      initialState: { "1": { id: "1", name: "wow" } },
      empty: emptyUser,
    }),
    token: slice.str(),
    counter: slice.num(),
    dev: slice.any<boolean>(false),
    currentUser: slice.obj<User>(emptyUser),
    cache: slice.table({ empty: {} }),
    loaders: slice.loaders(),
  });
  const store = createStore({ initialState });

  expect(store.getState()).toEqual({
    users: { "1": { id: "1", name: "wow" } },
    token: "",
    counter: 0,
    dev: false,
    currentUser: { id: "", name: "" },
    cache: {},
    loaders: {},
  });
  const userMap = db.users.selectTable(store.getState());
  expect(userMap).toEqual({ "1": { id: "1", name: "wow" } });

  await store.run(function* () {
    yield* db.update([
      db.users.add({ "2": { id: "2", name: "bob" } }),
      db.users.patch({ "1": { name: "zzz" } }),
    ]);

    const users = yield* select(db.users.selectTable);
    expect(users).toEqual({
      "1": { id: "1", name: "zzz" },
      "2": { id: "2", name: "bob" },
    });

    yield* db.update(db.counter.increment());
    const counter = yield* select(db.counter.select);
    expect(counter).toBe(1);

    yield* db.update(db.currentUser.update({ key: "name", value: "vvv" }));
    const curUser = yield* select(db.currentUser.select);
    expect(curUser).toEqual({ id: "", name: "vvv" });

    yield* db.update(db.loaders.start({ id: "fetch-users" }));
    const fetchLoader = yield* select(db.loaders.selectById, {
      id: "fetch-users",
    });
    expect(fetchLoader.id).toBe("fetch-users");
    expect(fetchLoader.status).toBe("loading");
    expect(fetchLoader.lastRun).not.toBe(0);
  });
});

it(tests, "can work with a nested object", async () => {
  expect.assertions(3);
  const [db, initialState] = createSchema({
    currentUser: slice.obj<UserWithRoles>({ id: "", name: "", roles: [] }),
    cache: slice.table({ empty: {} }),
    loaders: slice.loaders(),
  });
  const store = createStore({ initialState });
  await store.run(function* () {
    yield* db.update(db.currentUser.update({ key: "name", value: "vvv" }));
    const curUser = yield* select(db.currentUser.select);
    expect(curUser).toEqual({ id: "", name: "vvv", roles: [] });

    yield* db.update(db.currentUser.update({ key: "roles", value: ["admin"] }));
    const curUser2 = yield* select(db.currentUser.select);
    expect(curUser2).toEqual({ id: "", name: "vvv", roles: ["admin"] });

    yield* db.update(
      db.currentUser.update({ key: "roles", value: ["admin", "users"] }),
    );
    const curUser3 = yield* select(db.currentUser.select);
    expect(curUser3).toEqual({
      id: "",
      name: "vvv",
      roles: ["admin", "users"],
    });
  });
});
