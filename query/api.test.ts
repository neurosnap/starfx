import { describe, expect, it } from "../test.ts";

import { call, keepAlive } from "../fx/mod.ts";
import {
  configureStore,
  storeMdw,
  takeEvery,
  updateStore,
} from "../store/mod.ts";
import { createQueryState } from "../action.ts";

import { queryCtx, requestMonitor, urlParser } from "./middleware.ts";
import { createApi } from "./api.ts";
import { sleep } from "../test.ts";
import { createKey } from "./create-key.ts";
import type { ApiCtx } from "./types.ts";
import { Ok } from "../deps.ts";

interface User {
  id: string;
  name: string;
  email: string;
}

const mockUser: User = { id: "1", name: "test", email: "test@test.com" };

const jsonBlob = (data: unknown) => {
  return JSON.stringify(data);
};

const tests = describe("createApi()");

it(tests, "createApi - POST", async () => {
  const query = createApi();

  query.use(queryCtx);
  query.use(urlParser);
  query.use(query.routes());
  query.use(function* fetchApi(ctx, next): Iterator<unknown> {
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

      const buff = yield* call(() => {
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

  const store = await configureStore({ initialState: { users: {} } });
  store.run(query.bootup);

  store.dispatch(createUser({ email: mockUser.email }));
  await sleep(150);
  expect(store.getState().users).toEqual({
    "1": { id: "1", name: "test", email: "test@test.com" },
  });
});

it(tests, "POST with uri", async () => {
  const query = createApi();
  query.use(queryCtx);
  query.use(urlParser);
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

  const store = await configureStore({ initialState: { users: {} } });
  store.run(query.bootup);
  store.dispatch(createUser({ email: mockUser.email }));
});

it(tests, "middleware - with request fn", async () => {
  const query = createApi();
  query.use(queryCtx);
  query.use(urlParser);
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
  const store = await configureStore({ initialState: { users: {} } });
  store.run(query.bootup);
  store.dispatch(createUser());
});

it(tests, "run() on endpoint action - should run the effect", async () => {
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
  const action2 = api.get("/users2", function* (_, next) {
    yield* next();
    yield* call(() => action1.run(action1({ id: "1" })));
    acc += "b";
    expect(acc).toEqual("ab");
  });

  const store = await configureStore({ initialState: { users: {} } });
  store.run(api.bootup);
  store.dispatch(action2());
});

it(tests, "run() from a normal saga", async () => {
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
    const ctx = yield* call(() => action1.run(action1({ id: "1" })));
    if (!ctx.ok) {
      throw new Error("no ctx");
    }
    const payload = { name: "/users/:id [GET]", options: { id: "1" } };
    expect(ctx.value.action.type).toEqual(`@@saga-query${action1}`);
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

  const store = await configureStore({ initialState: { users: {} } });
  store.run(() => keepAlive([api.bootup, watchAction]));
  store.dispatch(action2());
});

it(tests, "createApi with hash key on a large post", async () => {
  const query = createApi();
  query.use(requestMonitor());
  query.use(storeMdw());
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
      const buff = yield* call(() => {
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
      ctx.json = Ok(curUsers);
    },
  );

  const email = mockUser.email + "9";
  const largetext = "abc-def-ghi-jkl-mno-pqr".repeat(100);

  const store = await configureStore({
    initialState: { ...createQueryState(), users: {} },
  });
  store.run(query.bootup);
  store.dispatch(createUserDefaultKey({ email, largetext }));

  await sleep(150);

  const s = store.getState();
  const expectedKey = createKey(`${createUserDefaultKey}`, {
    email,
    largetext,
  });

  expect([8, 9].includes(expectedKey.split("|")[1].length)).toBeTruthy();
  expect(s["@@starfx/data"][expectedKey]).toEqual({
    "1": { id: "1", name: "test", email: email, largetext: largetext },
  });
});

it(tests, "createApi - two identical endpoints", async () => {
  const actual: string[] = [];
  const api = createApi();
  api.use(requestMonitor());
  api.use(storeMdw());
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

  const store = await configureStore({ initialState: { users: {} } });
  store.run(api.bootup);
  store.dispatch(first());
  store.dispatch(second());

  await sleep(150);

  expect(actual).toEqual(["/health", "/health"]);
});

interface TestCtx<P = any, S = any> extends ApiCtx<P, S> {
  something: boolean;
}

// this is strictly for testing types
it(tests, "ensure types for get() endpoint", async () => {
  const api = createApi<TestCtx>();
  api.use(api.routes());
  api.use(function* (ctx, next) {
    yield* next();
    ctx.json = Ok({ result: "wow" });
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

  const store = await configureStore({ initialState: { users: {} } });
  store.run(api.bootup);

  store.dispatch(action1({ id: "1" }));
  expect(acc).toEqual(["1", "wow"]);
});

interface FetchUserProps {
  id: string;
}
type FetchUserCtx = TestCtx<FetchUserProps>;

// this is strictly for testing types
it(tests, "ensure ability to cast `ctx` in function definition", async () => {
  const api = createApi<TestCtx>();
  api.use(api.routes());
  api.use(function* (ctx, next) {
    yield* next();
    ctx.json = Ok({ result: "wow" });
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

  const store = await configureStore({ initialState: { users: {} } });
  store.run(api.bootup);
  store.dispatch(action1({ id: "1" }));
  expect(acc).toEqual(["1", "wow"]);
});

type FetchUserSecondCtx = TestCtx<any, { result: string }>;

// this is strictly for testing types
it(
  tests,
  "ensure ability to cast `ctx` in function definition with no props",
  async () => {
    const api = createApi<TestCtx>();
    api.use(api.routes());
    api.use(function* (ctx, next) {
      yield* next();
      ctx.json = Ok({ result: "wow" });
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

    const store = await configureStore({ initialState: { users: {} } });
    store.run(api.bootup);
    store.dispatch(action1());
    expect(acc).toEqual(["wow"]);
  },
);
