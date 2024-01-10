import { describe, expect, it } from "../test.ts";
import { keepAlive } from "../fx/mod.ts";
import {
  configureStore,
  createSchema,
  slice,
  storeMdw,
  takeEvery,
  updateStore,
} from "../store/mod.ts";
import { sleep } from "../test.ts";
import { safe } from "../mod.ts";
import * as mdw from "./mdw.ts";
import { createApi } from "./api.ts";
import { createKey } from "./create-key.ts";
import type { ApiCtx } from "./types.ts";
import { call } from "../deps.ts";

interface User {
  id: string;
  name: string;
  email: string;
}

const emptyUser: User = { id: "", name: "", email: "" };
const mockUser: User = { id: "1", name: "test", email: "test@test.com" };

const testStore = () => {
  const schema = createSchema({
    users: slice.table<User>({ empty: emptyUser }),
    loaders: slice.loader(),
    cache: slice.table({ empty: {} }),
  });
  const store = configureStore(schema);
  return { schema, store };
};

const jsonBlob = (data: unknown) => {
  return JSON.stringify(data);
};

const tests = describe("createApi()");

it(tests, "createApi - POST", async () => {
  const query = createApi();

  query.use(mdw.queryCtx);
  query.use(mdw.nameParser);
  query.use(query.routes());
  query.use(function* fetchApi(ctx, next) {
    expect(ctx.req()).toEqual({
      url: "/users",
      headers: {},
      method: "POST",
      body: JSON.stringify({ email: mockUser.email }),
    });
    const data = {
      users: [mockUser],
    };

    ctx.response = new Response(jsonBlob(data), { status: 200 });

    yield* next();
  });

  const createUser = query.post<{ email: string }, { users: User[] }>(
    `/users`,
    { supervisor: takeEvery },
    function* processUsers(ctx, next) {
      ctx.request = ctx.req({
        method: "POST",
        body: JSON.stringify({ email: ctx.payload.email }),
      });
      yield* next();

      const buff = yield* safe(() => {
        if (!ctx.response) throw new Error("no response");
        const res = ctx.response.arrayBuffer();
        return res;
      });

      if (!buff.ok) {
        throw buff.error;
      }

      const result = new TextDecoder("utf-8").decode(buff.value);
      const { users } = JSON.parse(result);
      if (!users) return;

      yield* updateStore<{ users: { [key: string]: User } }>((state) => {
        (users as User[]).forEach((u) => {
          state.users[u.id] = u;
        });
      });
    },
  );

  const store = configureStore({ initialState: { users: {} } });
  store.run(query.bootup);

  store.dispatch(createUser({ email: mockUser.email }));
  await sleep(150);
  expect(store.getState().users).toEqual({
    "1": { id: "1", name: "test", email: "test@test.com" },
  });
});

it(tests, "POST with uri", () => {
  const query = createApi();
  query.use(mdw.queryCtx);
  query.use(mdw.nameParser);
  query.use(query.routes());
  query.use(function* fetchApi(ctx, next) {
    expect(ctx.req()).toEqual({
      url: "/users",
      headers: {},
      method: "POST",
      body: JSON.stringify({ email: mockUser.email }),
    });

    const data = {
      users: [mockUser],
    };
    ctx.response = new Response(jsonBlob(data), { status: 200 });
    yield* next();
  });

  const userApi = query.uri("/users");
  const createUser = userApi.post<{ email: string }>(
    { supervisor: takeEvery },
    function* processUsers(
      ctx: ApiCtx<{ email: string }, { users: User[] }>,
      next,
    ) {
      ctx.request = ctx.req({
        body: JSON.stringify({ email: ctx.payload.email }),
      });

      yield* next();
      if (!ctx.json.ok) return;
      const { users } = ctx.json.value;
      yield* updateStore<{ users: { [key: string]: User } }>((state) => {
        users.forEach((u) => {
          state.users[u.id] = u;
        });
      });
    },
  );

  const store = configureStore({ initialState: { users: {} } });
  store.run(query.bootup);
  store.dispatch(createUser({ email: mockUser.email }));
});

it(tests, "middleware - with request fn", () => {
  const query = createApi();
  query.use(mdw.queryCtx);
  query.use(mdw.nameParser);
  query.use(query.routes());
  query.use(function* (ctx, next) {
    expect(ctx.req().method).toEqual("POST");
    expect(ctx.req().url).toEqual("/users");
    yield* next();
  });
  const createUser = query.create(
    "/users",
    { supervisor: takeEvery },
    query.request({ method: "POST" }),
  );
  const store = configureStore({ initialState: { users: {} } });
  store.run(query.bootup);
  store.dispatch(createUser());
});

it(tests, "run() on endpoint action - should run the effect", () => {
  const api = createApi<TestCtx>();
  api.use(api.routes());
  let acc = "";
  const action1 = api.get<{ id: string }, { result: boolean }>(
    "/users/:id",
    { supervisor: takeEvery },
    function* (_, next) {
      yield* next();
      acc += "a";
    },
  );
  const action2 = api.get(
    "/users2",
    { supervisor: takeEvery },
    function* (_, next) {
      yield* next();
      yield* call(() => action1.run(action1({ id: "1" })));
      acc += "b";
      expect(acc).toEqual("ab");
    },
  );

  const store = configureStore({ initialState: { users: {} } });
  store.run(api.bootup);
  store.dispatch(action2());
});

it(tests, "run() from a normal saga", () => {
  const api = createApi();
  api.use(api.routes());
  let acc = "";
  const action1 = api.get<{ id: string }>("/users/:id", {
    supervisor: takeEvery,
  }, function* (_, next) {
    yield* next();
    acc += "a";
  });
  const action2 = () => ({ type: "ACTION" });
  function* onAction() {
    const ctx = yield* safe(() => action1.run(action1({ id: "1" })));
    if (!ctx.ok) {
      throw new Error("no ctx");
    }
    const payload = { name: "/users/:id [GET]", options: { id: "1" } };
    expect(ctx.value.action.type).toEqual(`@@starfx${action1}`);
    expect(ctx.value.action.payload).toEqual(payload);
    expect(ctx.value.name).toEqual("/users/:id [GET]");
    expect(ctx.value.payload).toEqual({ id: "1" });
    acc += "b";
    expect(acc).toEqual("ab");
  }

  function* watchAction() {
    const task = yield* takeEvery(`${action2}`, onAction);
    yield* task;
  }

  const store = configureStore({ initialState: { users: {} } });
  store.run(() => keepAlive([api.bootup, watchAction]));
  store.dispatch(action2());
});

it(tests, "createApi with hash key on a large post", async () => {
  const { store, schema } = testStore();
  const query = createApi();
  query.use(mdw.api());
  query.use(storeMdw.store(schema.db));
  query.use(query.routes());
  query.use(function* fetchApi(ctx, next) {
    const data = {
      users: [{ ...mockUser, ...ctx.action.payload.options }],
    };
    ctx.response = new Response(jsonBlob(data), { status: 200 });
    yield* next();
  });
  const createUserDefaultKey = query.post<{ email: string; largetext: string }>(
    `/users`,
    { supervisor: takeEvery },
    function* processUsers(ctx, next) {
      ctx.cache = true;
      yield* next();
      const buff = yield* safe(() => {
        if (!ctx.response) {
          throw new Error("no response");
        }
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
        value: curUsers,
      };
    },
  );

  const email = mockUser.email + "9";
  const largetext = "abc-def-ghi-jkl-mno-pqr".repeat(100);

  store.run(query.bootup);
  store.dispatch(createUserDefaultKey({ email, largetext }));

  await sleep(150);

  const s = store.getState();
  const expectedKey = createKey(`${createUserDefaultKey}`, {
    email,
    largetext,
  });

  expect([8, 9].includes(expectedKey.split("|")[1].length)).toBeTruthy();
  expect(s.cache[expectedKey]).toEqual({
    "1": { id: "1", name: "test", email: email, largetext: largetext },
  });
});

it(tests, "createApi - two identical endpoints", async () => {
  const actual: string[] = [];
  const { store, schema } = testStore();
  const api = createApi();
  api.use(mdw.api());
  api.use(storeMdw.store(schema.db));
  api.use(mdw.nameParser);
  api.use(api.routes());

  const first = api.get(
    "/health",
    { supervisor: takeEvery },
    function* (ctx, next) {
      actual.push(ctx.req().url);
      yield* next();
    },
  );

  const second = api.get(
    ["/health", "poll"],
    { supervisor: takeEvery },
    function* (ctx, next) {
      actual.push(ctx.req().url);
      yield* next();
    },
  );

  store.run(api.bootup);
  store.dispatch(first());
  store.dispatch(second());

  await sleep(150);

  expect(actual).toEqual(["/health", "/health"]);
});

interface TestCtx<P = any, S = any, E = any> extends ApiCtx<P, S, E> {
  something: boolean;
}

// this is strictly for testing types
it(tests, "ensure types for get() endpoint", () => {
  const api = createApi<TestCtx>();
  api.use(api.routes());
  api.use(function* (ctx, next) {
    yield* next();
    const data = { result: "wow" };
    ctx.json = { ok: true, data, value: data };
  });

  const acc: string[] = [];
  const action1 = api.get<{ id: string }, { result: string }>(
    "/users/:id",
    { supervisor: takeEvery },
    function* (ctx, next) {
      ctx.something = false;
      acc.push(ctx.payload.id);

      yield* next();

      if (ctx.json.ok) {
        acc.push(ctx.json.value.result);
      }
    },
  );

  const store = configureStore({ initialState: { users: {} } });
  store.run(api.bootup);

  store.dispatch(action1({ id: "1" }));
  expect(acc).toEqual(["1", "wow"]);
});

interface FetchUserProps {
  id: string;
}
type FetchUserCtx = TestCtx<FetchUserProps>;

// this is strictly for testing types
it(tests, "ensure ability to cast `ctx` in function definition", () => {
  const api = createApi<TestCtx>();
  api.use(api.routes());
  api.use(function* (ctx, next) {
    yield* next();
    const data = { result: "wow" };
    ctx.json = { ok: true, data, value: data };
  });

  const acc: string[] = [];
  const action1 = api.get<FetchUserProps>(
    "/users/:id",
    { supervisor: takeEvery },
    function* (ctx: FetchUserCtx, next) {
      ctx.something = false;
      acc.push(ctx.payload.id);

      yield* next();

      if (ctx.json.ok) {
        acc.push(ctx.json.value.result);
      }
    },
  );

  const store = configureStore({ initialState: { users: {} } });
  store.run(api.bootup);
  store.dispatch(action1({ id: "1" }));
  expect(acc).toEqual(["1", "wow"]);
});

type FetchUserSecondCtx = TestCtx<any, { result: string }>;

// this is strictly for testing types
it(
  tests,
  "ensure ability to cast `ctx` in function definition with no props",
  () => {
    const api = createApi<TestCtx>();
    api.use(api.routes());
    api.use(function* (ctx, next) {
      yield* next();
      const data = { result: "wow" };
      ctx.json = { ok: true, data, value: data };
    });

    const acc: string[] = [];
    const action1 = api.get<never, { result: string }>(
      "/users",
      { supervisor: takeEvery },
      function* (ctx: FetchUserSecondCtx, next) {
        ctx.something = false;

        yield* next();

        if (ctx.json.ok) {
          acc.push(ctx.json.value.result);
        }
      },
    );

    const store = configureStore({ initialState: { users: {} } });
    store.run(api.bootup);
    store.dispatch(action1());
    expect(acc).toEqual(["wow"]);
  },
);

it(tests, "should bubble up error", () => {
  let error: any = null;
  const { store, schema } = testStore();
  const api = createApi();
  api.use(function* (_, next) {
    try {
      yield* next();
    } catch (err) {
      error = err;
    }
  });
  api.use(mdw.queryCtx);
  api.use(storeMdw.store(schema.db));
  api.use(api.routes());

  const fetchUser = api.get(
    "/users/8",
    { supervisor: takeEvery },
    function* (ctx, _) {
      (ctx.loader as any).meta = { key: ctx.payload.thisKeyDoesNotExist };
      throw new Error("GENERATING AN ERROR");
    },
  );

  store.run(api.bootup);
  store.dispatch(fetchUser());
  expect(error.message).toBe(
    "Cannot read properties of undefined (reading 'thisKeyDoesNotExist')",
  );
});
