import { asserts, describe, it } from "../test.ts";
import { configureStore, createSchema, select, slice } from "../store/mod.ts";

const tests = describe("createSchema()");

interface User {
  id: string;
  name: string;
}
interface UserWithRoles extends User {
  roles: string[];
}

const emptyUser = { id: "", name: "" };
it(tests, "general types and functionality", async () => {
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
    loaders: slice.loader(),
  });
  const store = configureStore({ initialState });

  asserts.assertEquals(store.getState(), {
    users: { "1": { id: "1", name: "wow" } },
    token: "",
    counter: 0,
    dev: false,
    currentUser: { id: "", name: "" },
    cache: {},
    loaders: {},
  });
  const userMap = db.users.selectTable(store.getState());
  asserts.assertEquals(userMap, { "1": { id: "1", name: "wow" } });

  await store.run(function* () {
    yield* db.update([
      db.users.add({ "2": { id: "2", name: "bob" } }),
      db.users.patch({ "1": { name: "zzz" } }),
    ]);

    const users = yield* select(db.users.selectTable);
    asserts.assertEquals(users, {
      "1": { id: "1", name: "zzz" },
      "2": { id: "2", name: "bob" },
    });

    yield* db.update(db.counter.increment());
    const counter = yield* select(db.counter.select);
    asserts.assertEquals(counter, 1);

    yield* db.update(db.currentUser.update({ key: "name", value: "vvv" }));
    const curUser = yield* select(db.currentUser.select);
    asserts.assertEquals(curUser, { id: "", name: "vvv" });

    yield* db.update(db.loaders.start({ id: "fetch-users" }));
    const fetchLoader = yield* select(db.loaders.selectById, {
      id: "fetch-users",
    });
    asserts.assertEquals(fetchLoader.id, "fetch-users");
    asserts.assertEquals(fetchLoader.status, "loading");
    asserts.assertNotEquals(fetchLoader.lastRun, 0);
  });
});

it(tests, "can work with a nested object", async () => {
  const [db, initialState] = createSchema({
    currentUser: slice.obj<UserWithRoles>({ id: "", name: "", roles: [] }),
    cache: slice.table({ empty: {} }),
    loaders: slice.loader(),
  });
  const store = configureStore({ initialState });
  await store.run(function* () {
    yield* db.update(db.currentUser.update({ key: "name", value: "vvv" }));
    const curUser = yield* select(db.currentUser.select);
    asserts.assertEquals(curUser, { id: "", name: "vvv", roles: [] });

    yield* db.update(
      db.currentUser.update({ key: "roles", value: ["admin"] }),
    );
    const curUser2 = yield* select(db.currentUser.select);
    asserts.assertEquals(curUser2, { id: "", name: "vvv", roles: ["admin"] });

    yield* db.update(
      db.currentUser.update({ key: "roles", value: ["admin", "users"] }),
    );
    const curUser3 = yield* select(db.currentUser.select);
    asserts.assertEquals(curUser3, {
      id: "",
      name: "vvv",
      roles: ["admin", "users"],
    });
  });
});
