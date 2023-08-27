import { describe, expect, install, it, mock } from "../test.ts";
import { configureStore, storeMdw, takeEvery } from "../store/mod.ts";
import { createQueryState } from "../action.ts";
import type { QueryState } from "../types.ts";

import { fetcher, fetchRetry } from "./fetch.ts";
import { createApi } from "./api.ts";
import { requestMonitor } from "./middleware.ts";

install();

const baseUrl = "https://saga-query.com";
const mockUser = { id: "1", email: "test@saga-query.com" };

const delay = (n = 200) =>
  new Promise((resolve) => {
    setTimeout(resolve, n);
  });

const tests = describe("fetcher()");

it(
  tests,
  "should be able to fetch a resource and save automatically",
  async () => {
    mock(`GET@/users`, () => {
      return new Response(JSON.stringify(mockUser));
    });

    const api = createApi();
    api.use(requestMonitor());
    api.use(storeMdw());
    api.use(api.routes());
    api.use(fetcher({ baseUrl }));

    const actual: any[] = [];
    const fetchUsers = api.get(
      "/users",
      { supervisor: takeEvery },
      function* (ctx, next) {
        ctx.cache = true;
        yield* next();

        actual.push(ctx.request);
        actual.push(ctx.json);
      },
    );

    const store = configureStore<QueryState>({
      initialState: createQueryState(),
    });
    store.run(api.bootup);

    const action = fetchUsers();
    store.dispatch(action);

    await delay();

    const state = store.getState();
    expect(state["@@starfx/data"][action.payload.key]).toEqual(mockUser);

    expect(actual).toEqual([{
      url: `${baseUrl}/users`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }, { ok: true, data: mockUser }]);
  },
);

it(
  tests,
  "fetch - should be able to fetch a resource and parse as text instead of json",
  async () => {
    mock(`GET@/users`, () => {
      return new Response("this is some text");
    });

    const api = createApi();
    api.use(requestMonitor());
    api.use(storeMdw());
    api.use(api.routes());
    api.use(fetcher({ baseUrl }));

    let actual = null;
    const fetchUsers = api.get(
      "/users",
      { supervisor: takeEvery },
      function* (ctx, next) {
        ctx.cache = true;
        ctx.bodyType = "text";
        yield* next();
        actual = ctx.json;
      },
    );

    const store = configureStore<QueryState>({
      initialState: createQueryState(),
    });
    store.run(api.bootup);

    const action = fetchUsers();
    store.dispatch(action);

    await delay();
    expect(actual).toEqual({ ok: true, data: "this is some text" });
  },
);

it(tests, "fetch - error handling", async () => {
  const errMsg = { message: "something happened" };
  mock(`GET@/users`, () => {
    return new Response(JSON.stringify(errMsg), { status: 500 });
  });

  const api = createApi();
  api.use(requestMonitor());
  api.use(storeMdw());
  api.use(api.routes());
  api.use(function* (ctx, next) {
    const url = ctx.req().url;
    ctx.request = ctx.req({ url: `${baseUrl}${url}` });
    yield* next();
  });
  api.use(fetcher());

  let actual = null;
  const fetchUsers = api.get(
    "/users",
    { supervisor: takeEvery },
    function* (ctx, next) {
      ctx.cache = true;
      yield* next();

      actual = ctx.json;
    },
  );

  const store = configureStore<QueryState>({
    initialState: createQueryState(),
  });
  store.run(api.bootup);

  const action = fetchUsers();
  store.dispatch(action);

  await delay();

  const state = store.getState();
  expect(state["@@starfx/data"][action.payload.key]).toEqual(errMsg);
  expect(actual).toEqual({ ok: false, data: errMsg });
});

it(tests, "fetch - status 204", async () => {
  mock(`GET@/users`, () => {
    return new Response(null, { status: 204 });
  });

  const api = createApi();
  api.use(requestMonitor());
  api.use(storeMdw());
  api.use(api.routes());
  api.use(function* (ctx, next) {
    const url = ctx.req().url;
    ctx.request = ctx.req({ url: `${baseUrl}${url}` });
    yield* next();
  });
  api.use(fetcher());

  let actual = null;
  const fetchUsers = api.get(
    "/users",
    { supervisor: takeEvery },
    function* (ctx, next) {
      ctx.cache = true;
      yield* next();
      actual = ctx.json;
    },
  );

  const store = configureStore<QueryState>({
    initialState: createQueryState(),
  });
  store.run(api.bootup);

  const action = fetchUsers();
  store.dispatch(action);

  await delay();

  const state = store.getState();
  expect(state["@@starfx/data"][action.payload.key]).toEqual({});
  expect(actual).toEqual({ ok: true, data: {} });
});

it(tests, "fetch - malformed json", async () => {
  mock(`GET@/users`, () => {
    return new Response("not json", { status: 200 });
  });

  const api = createApi();
  api.use(requestMonitor());
  api.use(storeMdw());
  api.use(api.routes());
  api.use(function* (ctx, next) {
    const url = ctx.req().url;
    ctx.request = ctx.req({ url: `${baseUrl}${url}` });
    yield* next();
  });
  api.use(fetcher());

  let actual = null;
  const fetchUsers = api.get(
    "/users",
    { supervisor: takeEvery },
    function* (ctx, next) {
      ctx.cache = true;
      yield* next();

      actual = ctx.json;
    },
  );

  const store = configureStore<QueryState>({
    initialState: createQueryState(),
  });
  store.run(api.bootup);
  const action = fetchUsers();
  store.dispatch(action);

  await delay();

  expect(actual).toEqual({
    ok: false,
    data: {
      message: "Unexpected token 'o', \"not json\" is not valid JSON",
    },
  });
});

it(tests, "fetch - POST", async () => {
  mock(`POST@/users`, () => {
    return new Response(JSON.stringify(mockUser));
  });

  const api = createApi();
  api.use(requestMonitor());
  api.use(storeMdw());
  api.use(api.routes());
  api.use(fetcher({ baseUrl }));

  const fetchUsers = api.post(
    "/users",
    { supervisor: takeEvery },
    function* (ctx, next) {
      ctx.cache = true;
      ctx.request = ctx.req({ body: JSON.stringify(mockUser) });
      yield* next();

      expect(ctx.req()).toEqual({
        url: `${baseUrl}/users`,
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(mockUser),
      });

      expect(ctx.json).toEqual({ ok: true, data: mockUser });
    },
  );

  const store = configureStore<QueryState>({
    initialState: createQueryState(),
  });
  store.run(api.bootup);
  const action = fetchUsers();
  store.dispatch(action);

  await delay();
});

it(tests, "fetch - POST multiple endpoints with same uri", async () => {
  mock(`POST@/users/1/something`, () => {
    return new Response(JSON.stringify(mockUser));
  });

  const api = createApi();
  api.use(requestMonitor());
  api.use(storeMdw());
  api.use(api.routes());
  api.use(fetcher({ baseUrl }));

  const fetchUsers = api.post<{ id: string }>(
    "/users/:id/something",
    { supervisor: takeEvery },
    function* (ctx, next) {
      ctx.cache = true;
      ctx.request = ctx.req({ body: JSON.stringify(mockUser) });
      yield* next();

      expect(ctx.req()).toEqual({
        url: `${baseUrl}/users/1/something`,
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(mockUser),
      });

      expect(ctx.json).toEqual({ ok: true, data: mockUser });
    },
  );

  const fetchUsersSecond = api.post<{ id: string }>(
    ["/users/:id/something", "next"],
    function* (ctx, next) {
      ctx.cache = true;
      ctx.request = ctx.req({ body: JSON.stringify(mockUser) });
      yield* next();

      expect(ctx.req()).toEqual({
        url: `${baseUrl}/users/1/something`,
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(mockUser),
      });

      expect(ctx.json).toEqual({ ok: true, data: mockUser });
    },
  );

  const store = configureStore<QueryState>({
    initialState: createQueryState(),
  });
  store.run(api.bootup);

  store.dispatch(fetchUsers({ id: "1" }));
  store.dispatch(fetchUsersSecond({ id: "1" }));

  await delay();
});

it(
  tests,
  "fetch - slug in url but payload has empty string for slug value",
  async () => {
    const api = createApi();
    api.use(requestMonitor());
    api.use(storeMdw());
    api.use(api.routes());
    api.use(fetcher({ baseUrl }));

    const fetchUsers = api.post<{ id: string }>(
      "/users/:id",
      { supervisor: takeEvery },
      function* (ctx, next) {
        ctx.cache = true;
        ctx.request = ctx.req({ body: JSON.stringify(mockUser) });

        yield* next();

        expect(ctx.json).toEqual({
          ok: false,
          data:
            "found :id in endpoint name (/users/:id [POST]) but payload has falsy value ()",
        });
      },
    );

    const store = configureStore<QueryState>({
      initialState: createQueryState(),
    });
    store.run(api.bootup);
    const action = fetchUsers({ id: "" });
    store.dispatch(action);

    await delay();
  },
);

it(
  tests,
  "fetch retry - with success - should keep retrying fetch request",
  async () => {
    let counter = 0;
    mock(`GET@/users`, () => {
      counter += 1;
      if (counter > 4) {
        return new Response(JSON.stringify(mockUser));
      }
      return new Response(JSON.stringify({ message: "error" }), {
        status: 400,
      });
    });

    const api = createApi();
    api.use(requestMonitor());
    api.use(storeMdw());
    api.use(api.routes());
    api.use(fetcher({ baseUrl }));

    let actual = null;
    const fetchUsers = api.get("/users", { supervisor: takeEvery }, [
      function* (ctx, next) {
        ctx.cache = true;
        yield* next();

        if (!ctx.json.ok) {
          return;
        }

        actual = ctx.json;
      },
      fetchRetry((n) => (n > 4 ? -1 : 10)),
    ]);

    const store = configureStore<QueryState>({
      initialState: createQueryState(),
    });
    store.run(api.bootup);

    const action = fetchUsers();
    store.dispatch(action);

    await delay();

    const state = store.getState();
    expect(state["@@starfx/data"][action.payload.key]).toEqual(mockUser);
    expect(actual).toEqual({ ok: true, data: mockUser });
  },
);

it(
  tests,
  "fetch retry - with failure - should keep retrying and then quit",
  async () => {
    mock(`GET@/users`, () => {
      return new Response(JSON.stringify({ message: "error" }), {
        status: 400,
      });
    });

    let actual = null;
    const api = createApi();
    api.use(requestMonitor());
    api.use(storeMdw());
    api.use(api.routes());
    api.use(fetcher({ baseUrl }));

    const fetchUsers = api.get("/users", { supervisor: takeEvery }, [
      function* (ctx, next) {
        ctx.cache = true;
        yield* next();
        actual = ctx.json;
      },
      fetchRetry((n) => (n > 2 ? -1 : 10)),
    ]);

    const store = configureStore<QueryState>({
      initialState: createQueryState(),
    });
    store.run(api.bootup);
    const action = fetchUsers();
    store.dispatch(action);

    await delay();
    expect(actual).toEqual({ ok: false, data: { message: "error" } });
  },
);
