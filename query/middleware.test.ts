import { assertLike, asserts, describe, expect, it } from "../test.ts";
import {
  createApi,
  createKey,
  customKey,
  queryCtx,
  requestMonitor,
  urlParser,
} from "../query/mod.ts";
import type { ApiCtx, Next, PipeCtx } from "../query/mod.ts";
import { createQueryState } from "../action.ts";
import { sleep } from "../test.ts";

import {
  configureStore,
  createSchema,
  slice,
  storeMdw,
  takeEvery,
  takeLatest,
  updateStore,
} from "../store/mod.ts";
import { safe } from "../mod.ts";
import { StoreApiCtx } from "../store/query.ts";

interface User {
  id: string;
  name: string;
  email: string;
}

const emptyUser: User = { id: "", name: "", email: "" };
const mockUser: User = { id: "1", name: "test", email: "test@test.com" };
const mockUser2: User = { id: "2", name: "two", email: "two@test.com" };

// deno-lint-ignore no-explicit-any
const jsonBlob = (data: any) => {
  return JSON.stringify(data);
};

const testStore = () => {
  const schema = createSchema({
    users: slice.table<User>({ empty: emptyUser }),
    loaders: slice.loader(),
    data: slice.table({ empty: {} }),
  });
  const store = configureStore(schema);
  return { schema, store };
};

const tests = describe("middleware");

it(tests, "basic", () => {
  const { store } = testStore();
  const query = createApi<ApiCtx>();
  query.use(queryCtx);
  query.use(urlParser);
  query.use(query.routes());
  query.use(function* fetchApi(ctx, next) {
    if (`${ctx.req().url}`.startsWith("/users/")) {
      ctx.json = { ok: true, data: mockUser2 };
      yield* next();
      return;
    }
    const data = {
      users: [mockUser],
    };
    ctx.json = { ok: true, data };
    yield* next();
  });

  const fetchUsers = query.create(
    `/users`,
    { supervisor: takeEvery },
    function* processUsers(ctx: ApiCtx<unknown, { users: User[] }>, next) {
      yield* next();
      if (!ctx.json.ok) return;
      const { users } = ctx.json.data;

      yield* updateStore((state) => {
        users.forEach((u) => {
          state.users[u.id] = u;
        });
      });
    },
  );

  const fetchUser = query.create<{ id: string }>(
    `/users/:id`,
    {
      supervisor: takeLatest,
    },
    function* processUser(ctx, next) {
      ctx.request = ctx.req({ method: "POST" });
      yield* next();
      if (!ctx.json.ok) return;
      const curUser = ctx.json.data;
      yield* updateStore((state) => {
        state.users[curUser.id] = curUser;
      });
    },
  );

  store.run(query.bootup);

  store.dispatch(fetchUsers());
  expect(store.getState().users).toEqual(
    { [mockUser.id]: mockUser },
  );
  store.dispatch(fetchUser({ id: "2" }));
  expect(store.getState().users).toEqual({
    [mockUser.id]: mockUser,
    [mockUser2.id]: mockUser2,
  });
});

it(tests, "with loader", () => {
  const { schema, store } = testStore();
  type MyCtx<P = any, S = any, E = any> = StoreApiCtx<typeof schema, P, S, E>;
  const api = createApi<MyCtx>();
  api.use(requestMonitor());
  api.use(storeMdw({ schema }));
  api.use(api.routes());
  api.use(function* fetchApi(ctx, next) {
    ctx.response = new Response(jsonBlob(mockUser), { status: 200 });
    ctx.json = { ok: true, data: { users: [mockUser] } };
    yield* next();
  });

  const fetchUsers = api.create(
    `/users`,
    { supervisor: takeEvery },
    function* processUsers(ctx: MyCtx<unknown, { users: User[] }>, next) {
      yield* next();
      if (!ctx.json.ok) return;

      const { data } = ctx.json;

      yield* ctx.update((state) => {
        data.users.forEach((u) => {
          state.users[u.id] = u;
        });
      });
    },
  );

  store.run(api.bootup);

  store.dispatch(fetchUsers());
  assertLike(store.getState(), {
    users: { [mockUser.id]: mockUser },
    loaders: {
      "/users": {
        status: "success",
      },
    },
  });
});

it(tests, "with item loader", () => {
  const { store, schema } = testStore();
  type MyCtx<P = any, S = any, E = any> = StoreApiCtx<typeof schema, P, S, E>;
  const api = createApi<MyCtx>();
  api.use(requestMonitor());
  api.use(storeMdw({ schema }));
  api.use(api.routes());
  api.use(function* fetchApi(ctx, next) {
    ctx.response = new Response(jsonBlob(mockUser), { status: 200 });
    ctx.json = { ok: true, data: { users: [mockUser] } };
    yield* next();
  });

  const fetchUser = api.create<{ id: string }>(
    `/users/:id`,
    { supervisor: takeEvery },
    function* processUsers(ctx: MyCtx<unknown, { users: User[] }>, next) {
      yield* next();
      if (!ctx.json.ok) return;

      const { data } = ctx.json;
      yield* ctx.update((state) => {
        data.users.forEach((u) => {
          state.users[u.id] = u;
        });
      });
    },
  );

  store.run(api.bootup);

  const action = fetchUser({ id: mockUser.id });
  store.dispatch(action);
  assertLike(store.getState(), {
    users: { [mockUser.id]: mockUser },
    loaders: {
      "/users/:id": {
        status: "success",
      },
      [action.payload.key]: {
        status: "success",
      },
    },
  });
});

it(tests, "with POST", () => {
  const query = createApi();
  query.use(queryCtx);
  query.use(urlParser);
  query.use(query.routes());
  query.use(function* fetchApi(ctx, next) {
    const request = ctx.req();
    asserts.assertEquals(request, {
      url: "/users",
      headers: {},
      method: "POST",
      body: JSON.stringify({ email: "test@test.com" }),
    });

    const data = {
      users: [mockUser],
    };
    ctx.response = new Response(jsonBlob(data), { status: 200 });
    yield* next();
  });

  const createUser = query.create<{ email: string }>(
    `/users [POST]`,
    { supervisor: takeEvery },
    function* processUsers(
      ctx: ApiCtx<{ email: string }, { users: User[] }>,
      next,
    ) {
      ctx.request = ctx.req({
        method: "POST",
        body: JSON.stringify({ email: ctx.payload.email }),
      });

      yield* next();

      if (!ctx.json.ok) return;

      const { users } = ctx.json.data;
      yield* updateStore((state) => {
        users.forEach((u) => {
          state.users[u.id] = u;
        });
      });
    },
  );

  const { store } = testStore();
  store.run(query.bootup);
  store.dispatch(createUser({ email: mockUser.email }));
});

it(tests, "simpleCache", () => {
  const { store, schema } = testStore();
  const api = createApi<StoreApiCtx<typeof schema>>();
  api.use(requestMonitor());
  api.use(storeMdw({ schema }));
  api.use(api.routes());
  api.use(function* fetchApi(ctx, next) {
    const data = { users: [mockUser] };
    ctx.response = new Response(jsonBlob(data));
    ctx.json = { ok: true, data };
    yield* next();
  });

  const fetchUsers = api.get("/users", { supervisor: takeEvery }, api.cache());
  store.run(api.bootup);

  const action = fetchUsers();
  store.dispatch(action);
  assertLike(store.getState(), {
    data: {
      [action.payload.key]: { users: [mockUser] },
    },
    loaders: {
      [`${fetchUsers}`]: {
        status: "success",
      },
    },
  });
});

it(tests, "overriding default loader behavior", () => {
  const { store, schema } = testStore();
  type MyCtx<P = any, S = any, E = any> = StoreApiCtx<typeof schema, P, S, E>;
  const api = createApi<MyCtx>();
  api.use(requestMonitor());
  api.use(storeMdw({ schema }));
  api.use(api.routes());
  api.use(function* fetchApi(ctx, next) {
    const data = { users: [mockUser] };
    ctx.response = new Response(jsonBlob(data));
    ctx.json = { ok: true, data };
    yield* next();
  });

  const fetchUsers = api.create(
    `/users`,
    { supervisor: takeEvery },
    function* (ctx: MyCtx<unknown, { users: User[] }>, next) {
      const id = ctx.name;
      yield* next();

      if (!ctx.json.ok) {
        return;
      }
      const { data } = ctx.json;
      ctx.loader = { id, message: "yes", meta: { wow: true } };
      yield* ctx.update((state) => {
        data.users.forEach((u) => {
          state.users[u.id] = u;
        });
      });
    },
  );

  store.run(api.bootup);

  store.dispatch(fetchUsers());
  assertLike(store.getState(), {
    users: { [mockUser.id]: mockUser },
    loaders: {
      [`${fetchUsers}`]: {
        status: "success",
        message: "yes",
        meta: { wow: true },
      },
    },
  });
});

it(tests, "requestMonitor - error handler", () => {
  let err = false;
  console.error = (msg: string) => {
    if (err) return;
    asserts.assertEquals(
      msg,
      "Error: something happened.  Check the endpoint [/users]",
    );
    err = true;
  };

  const { schema, store } = testStore();
  const query = createApi<StoreApiCtx<typeof schema>>();
  query.use(requestMonitor());
  query.use(storeMdw({ schema }));
  query.use(query.routes());
  query.use(function* () {
    throw new Error("something happened");
  });

  const fetchUsers = query.create(`/users`, { supervisor: takeEvery });

  store.run(query.bootup);
  store.dispatch(fetchUsers());
});

it(tests, "createApi with own key", async () => {
  const { schema, store } = testStore();
  const query = createApi<StoreApiCtx<typeof schema>>();
  query.use(requestMonitor());
  query.use(storeMdw({ schema }));
  query.use(query.routes());
  query.use(customKey);
  query.use(function* fetchApi(ctx, next) {
    const data = {
      users: [{ ...mockUser, ...ctx.action.payload.options }],
    };
    ctx.response = new Response(jsonBlob(data), { status: 200 });
    yield* next();
  });

  const theTestKey = `some-custom-key-${Math.ceil(Math.random() * 1000)}`;

  const createUserCustomKey = query.post<{ email: string }>(
    `/users`,
    { supervisor: takeEvery },
    function* processUsers(ctx: ApiCtx, next) {
      ctx.cache = true;
      ctx.key = theTestKey; // or some calculated key //
      yield* next();
      const buff = yield* safe(() => {
        if (!ctx.response) throw new Error("no response");
        return ctx.response.arrayBuffer();
      });
      if (!buff.ok) {
        throw buff.error;
      }

      const result = new TextDecoder("utf-8").decode(buff.value);
      const { users } = JSON.parse(result);
      if (!users) return;
      const curUsers = (users as User[]).reduce<Record<string, User>>(
        (acc, u) => {
          acc[u.id] = u;
          return acc;
        },
        {},
      );
      ctx.response = new Response();
      ctx.json = {
        ok: true,
        data: curUsers,
      };
    },
  );
  const newUEmail = mockUser.email + ".org";

  store.run(query.bootup);

  store.dispatch(createUserCustomKey({ email: newUEmail }));
  await sleep(150);
  const expectedKey = theTestKey
    ? `/users [POST]|${theTestKey}`
    : createKey("/users [POST]", { email: newUEmail });

  const s = store.getState();
  asserts.assertEquals(schema.db.data.selectById(s, { id: expectedKey }), {
    "1": { id: "1", name: "test", email: newUEmail },
  });

  asserts.assert(
    expectedKey.split("|")[1] === theTestKey,
    "the keypart should match the input",
  );
});

it(tests, "createApi with custom key but no payload", async () => {
  const { store, schema } = testStore();
  const query = createApi<StoreApiCtx<typeof schema>>();
  query.use(requestMonitor());
  query.use(storeMdw({ schema }));
  query.use(query.routes());
  query.use(customKey);
  query.use(function* fetchApi(ctx, next) {
    const data = {
      users: [mockUser],
    };
    ctx.response = new Response(jsonBlob(data), { status: 200 });
    yield* next();
  });

  const theTestKey = `some-custom-key-${Math.ceil(Math.random() * 1000)}`;

  const getUsers = query.get(
    `/users`,
    { supervisor: takeEvery },
    function* processUsers(ctx: ApiCtx, next) {
      ctx.cache = true;
      ctx.key = theTestKey; // or some calculated key //
      yield* next();
      const buff = yield* safe(() => {
        if (!ctx.response) throw new Error("no response");
        return ctx.response?.arrayBuffer();
      });
      if (!buff.ok) {
        throw buff.error;
      }

      const result = new TextDecoder("utf-8").decode(buff.value);
      const { users } = JSON.parse(result);
      if (!users) return;
      const curUsers = (users as User[]).reduce<Record<string, User>>(
        (acc, u) => {
          acc[u.id] = u;
          return acc;
        },
        {},
      );
      ctx.response = new Response();
      ctx.json = {
        ok: true,
        data: curUsers,
      };
    },
  );

  store.run(query.bootup);

  store.dispatch(getUsers());
  await sleep(150);
  const expectedKey = theTestKey
    ? `/users [GET]|${theTestKey}`
    : createKey("/users [GET]", null);

  const s = store.getState();
  asserts.assertEquals(schema.db.data.selectById(s, { id: expectedKey }), {
    "1": mockUser,
  });

  asserts.assert(
    expectedKey.split("|")[1] === theTestKey,
    "the keypart should match the input",
  );
});

it(tests, "errorHandler", () => {
  let a = 0;
  const query = createApi<ApiCtx>();
  query.use(function* errorHandler<Ctx extends PipeCtx = PipeCtx>(
    ctx: Ctx,
    next: Next,
  ) {
    a = 1;
    yield* next();
    a = 2;
    if (!ctx.result.ok) {
      console.error(
        `Error: ${ctx.result.error.message}.  Check the endpoint [${ctx.name}]`,
        ctx,
      );
      console.error(ctx.result.error);
    }
  });
  query.use(queryCtx);
  query.use(urlParser);
  query.use(query.routes());
  query.use(function* fetchApi(ctx, next) {
    if (`${ctx.req().url}`.startsWith("/users/")) {
      ctx.json = { ok: true, data: mockUser2 };
      yield* next();
      return;
    }
    const data = {
      users: [mockUser],
    };
    ctx.json = { ok: true, data };
    yield* next();
  });

  const fetchUsers = query.create(
    `/users`,
    { supervisor: takeEvery },
    function* processUsers(_: ApiCtx<unknown, { users: User[] }>, next) {
      // throw new Error("some error");
      yield* next();
    },
  );

  const store = configureStore({
    initialState: {
      ...createQueryState(),
      users: {},
    },
  });
  store.run(query.bootup);
  store.dispatch(fetchUsers());
  expect(store.getState()).toEqual({
    ...createQueryState(),
    users: {},
  });
  expect(a).toEqual(2);
});
