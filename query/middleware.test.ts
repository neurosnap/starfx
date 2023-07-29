// deno-lint-ignore-file
import { assertLike, asserts, describe, expect, it } from "../test.ts";
import { sleep as delay } from "../deps.ts";
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
import type { QueryState } from "../types.ts";
import { sleep } from "../test.ts";

import type { UndoCtx } from "../store/mod.ts";
import {
  configureStore,
  defaultLoader,
  selectDataById,
  storeMdw,
  takeEvery,
  takeLatest,
  undo,
  undoer,
  updateStore,
} from "../store/mod.ts";
import { safe } from "../mod.ts";

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState extends QueryState {
  users: { [key: string]: User };
}

const mockUser: User = { id: "1", name: "test", email: "test@test.com" };
const mockUser2: User = { id: "2", name: "two", email: "two@test.com" };

// deno-lint-ignore no-explicit-any
const jsonBlob = (data: any) => {
  return JSON.stringify(data);
};

const tests = describe("middleware");

it(tests, "basic", () => {
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

      yield* updateStore<UserState>((state) => {
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
      yield* updateStore<UserState>((state) => {
        state.users[curUser.id] = curUser;
      });
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
    users: { [mockUser.id]: mockUser },
  });
  store.dispatch(fetchUser({ id: "2" }));
  expect(store.getState()).toEqual({
    ...createQueryState(),
    users: { [mockUser.id]: mockUser, [mockUser2.id]: mockUser2 },
  });
});

it(tests, "with loader", () => {
  const api = createApi<ApiCtx>();
  api.use(requestMonitor());
  api.use(storeMdw());
  api.use(api.routes());
  api.use(function* fetchApi(ctx, next) {
    ctx.response = new Response(jsonBlob(mockUser), { status: 200 });
    ctx.json = { ok: true, data: { users: [mockUser] } };
    yield* next();
  });

  const fetchUsers = api.create(
    `/users`,
    { supervisor: takeEvery },
    function* processUsers(ctx: ApiCtx<unknown, { users: User[] }>, next) {
      yield* next();
      if (!ctx.json.ok) return;

      const { data } = ctx.json;

      yield* updateStore<UserState>((state) => {
        data.users.forEach((u) => {
          state.users[u.id] = u;
        });
      });
    },
  );

  const store = configureStore<UserState>({
    initialState: { ...createQueryState(), users: {} },
  });
  store.run(api.bootup);

  store.dispatch(fetchUsers());
  assertLike(store.getState(), {
    users: { [mockUser.id]: mockUser },
    "@@starfx/loaders": {
      "/users": {
        status: "success",
      },
    },
  });
});

it(tests, "with item loader", () => {
  const api = createApi<ApiCtx>();
  api.use(requestMonitor());
  api.use(storeMdw());
  api.use(api.routes());
  api.use(function* fetchApi(ctx, next) {
    ctx.response = new Response(jsonBlob(mockUser), { status: 200 });
    ctx.json = { ok: true, data: { users: [mockUser] } };
    yield* next();
  });

  const fetchUser = api.create<{ id: string }>(
    `/users/:id`,
    { supervisor: takeEvery },
    function* processUsers(ctx: ApiCtx<unknown, { users: User[] }>, next) {
      yield* next();
      if (!ctx.json.ok) return;

      const { data } = ctx.json;
      yield* updateStore<UserState>((state) => {
        data.users.forEach((u) => {
          state.users[u.id] = u;
        });
      });
    },
  );

  const store = configureStore<UserState>({
    initialState: { ...createQueryState(), users: {} },
  });
  store.run(api.bootup);

  const action = fetchUser({ id: mockUser.id });
  store.dispatch(action);
  assertLike(store.getState(), {
    users: { [mockUser.id]: mockUser },
    "@@starfx/loaders": {
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
      yield* updateStore<UserState>((state) => {
        users.forEach((u) => {
          state.users[u.id] = u;
        });
      });
    },
  );

  const store = configureStore<UserState>({
    initialState: { ...createQueryState(), users: {} },
  });
  store.run(query.bootup);

  store.dispatch(createUser({ email: mockUser.email }));
});

it(tests, "simpleCache", () => {
  const api = createApi<ApiCtx>();
  api.use(requestMonitor());
  api.use(storeMdw());
  api.use(api.routes());
  api.use(function* fetchApi(ctx, next) {
    const data = { users: [mockUser] };
    ctx.response = new Response(jsonBlob(data));
    ctx.json = { ok: true, data };
    yield* next();
  });

  const fetchUsers = api.get("/users", { supervisor: takeEvery }, api.cache());
  const store = configureStore<UserState>({
    initialState: { ...createQueryState(), users: {} },
  });
  store.run(api.bootup);

  const action = fetchUsers();
  store.dispatch(action);
  assertLike(store.getState(), {
    "@@starfx/data": {
      [action.payload.key]: { users: [mockUser] },
    },
    "@@starfx/loaders": {
      [`${fetchUsers}`]: {
        status: "success",
      },
    },
  });
});

it(tests, "overriding default loader behavior", () => {
  const api = createApi<ApiCtx>();
  api.use(requestMonitor());
  api.use(storeMdw());
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
    function* (ctx: ApiCtx<unknown, { users: User[] }>, next) {
      const id = ctx.name;
      yield* next();

      if (!ctx.json.ok) {
        return;
      }
      const { data } = ctx.json;
      ctx.loader = { id, message: "yes", meta: { wow: true } };
      yield* updateStore<UserState>((state) => {
        data.users.forEach((u) => {
          state.users[u.id] = u;
        });
      });
    },
  );

  const store = configureStore<UserState>({
    initialState: { ...createQueryState(), users: {} },
  });
  store.run(api.bootup);

  store.dispatch(fetchUsers());
  assertLike(store.getState(), {
    users: { [mockUser.id]: mockUser },
    "@@starfx/loaders": {
      [`${fetchUsers}`]: {
        status: "success",
        message: "yes",
        meta: { wow: true },
      },
    },
  });
});

it(tests, "undo", () => {
  const api = createApi<UndoCtx>();
  api.use(requestMonitor());
  api.use(storeMdw());
  api.use(api.routes());
  api.use(undoer());

  api.use(function* fetchApi(ctx, next) {
    yield* delay(500);
    ctx.response = new Response(jsonBlob({ users: [mockUser] }), {
      status: 200,
    });
    yield* next();
  });

  const createUser = api.post(
    "/users",
    { supervisor: takeEvery },
    function* (ctx, next) {
      ctx.undoable = true;
      yield* next();
    },
  );

  const store = configureStore<UserState>({
    initialState: { ...createQueryState(), users: {} },
  });
  store.run(api.bootup);

  const action = createUser();
  store.dispatch(action);
  store.dispatch(undo());
  assertLike(store.getState(), {
    ...createQueryState({
      "@@starfx/loaders": {
        [`${createUser}`]: defaultLoader(),
        [action.payload.name]: defaultLoader(),
      },
    }),
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
  const query = createApi<ApiCtx>();

  query.use(requestMonitor());
  query.use(storeMdw());
  query.use(query.routes());
  query.use(function* () {
    throw new Error("something happened");
  });

  const fetchUsers = query.create(`/users`, { supervisor: takeEvery });

  const store = configureStore<UserState>({
    initialState: { ...createQueryState(), users: {} },
  });
  store.run(query.bootup);

  store.dispatch(fetchUsers());
});

it(tests, "createApi with own key", async () => {
  const query = createApi();
  query.use(requestMonitor());
  query.use(storeMdw());
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
  const store = configureStore<UserState>({
    initialState: { ...createQueryState(), users: {} },
  });
  store.run(query.bootup);

  store.dispatch(createUserCustomKey({ email: newUEmail }));
  await sleep(150);
  const expectedKey = theTestKey
    ? `/users [POST]|${theTestKey}`
    : createKey("/users [POST]", { email: newUEmail });

  const s = store.getState();
  asserts.assertEquals(selectDataById(s, { id: expectedKey }), {
    "1": { id: "1", name: "test", email: newUEmail },
  });

  asserts.assert(
    expectedKey.split("|")[1] === theTestKey,
    "the keypart should match the input",
  );
});

it(tests, "createApi with custom key but no payload", async () => {
  const query = createApi();
  query.use(requestMonitor());
  query.use(storeMdw());
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

  const store = configureStore<UserState>({
    initialState: { ...createQueryState(), users: {} },
  });
  store.run(query.bootup);

  store.dispatch(getUsers());
  await sleep(150);
  const expectedKey = theTestKey
    ? `/users [GET]|${theTestKey}`
    : createKey("/users [GET]", null);

  const s = store.getState();
  asserts.assertEquals(selectDataById(s, { id: expectedKey }), {
    "1": mockUser,
  });

  asserts.assert(
    expectedKey.split("|")[1] === theTestKey,
    "the keypart should match the input",
  );
});

it(tests, "errorHandler", async () => {
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
    // deno-lint-ignore no-unused-vars
    function* processUsers(ctx: ApiCtx<unknown, { users: User[] }>, next) {
      // throw new Error("some error");
      // deno-lint-ignore no-unreachable
      yield* next();
    },
  );

  const store = await configureStore({
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
