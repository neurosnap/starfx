import { describe, expect, install, it, mock } from "../test.ts";
import {
  configureStore,
  createSchema,
  slice,
  storeMdw,
  waitForLoader,
  waitForLoaders,
} from "../store/mod.ts";
import { ApiCtx, createApi, mdw, takeEvery } from "../mod.ts";

install();

const baseUrl = "https://starfx.com";
const mockUser = { id: "1", email: "test@starfx.com" };

const testStore = () => {
  const [schema, initialState] = createSchema({
    loaders: slice.loader(),
    cache: slice.table({ empty: {} }),
  });
  const store = configureStore({ initialState });
  return { schema, store };
};

const getTestData = (ctx: ApiCtx) => {
  return { request: { ...ctx.req() }, json: { ...ctx.json } };
};

const tests = describe("mdw.fetch()");

it(
  tests,
  "should be able to fetch a resource and save automatically",
  async () => {
    mock(`GET@/users`, () => {
      return new Response(JSON.stringify(mockUser));
    });

    const { store, schema } = testStore();
    const api = createApi();
    api.use(mdw.api());
    api.use(storeMdw.store(schema));
    api.use(api.routes());
    api.use(mdw.headers);
    api.use(mdw.fetch({ baseUrl }));

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

    store.run(api.bootup);

    const action = fetchUsers();
    store.dispatch(action);

    await store.run(waitForLoader(schema.loaders, action));

    const state = store.getState();
    expect(state.cache[action.payload.key]).toEqual(mockUser);
    expect(actual).toEqual([{
      url: `${baseUrl}/users`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }, { ok: true, data: mockUser, value: mockUser }]);
  },
);

it(
  tests,
  "should be able to fetch a resource and parse as text instead of json",
  async () => {
    mock(`GET@/users`, () => {
      return new Response("this is some text");
    });

    const { store, schema } = testStore();
    const api = createApi();
    api.use(mdw.api());
    api.use(storeMdw.store(schema));
    api.use(api.routes());
    api.use(mdw.fetch({ baseUrl }));

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

    store.run(api.bootup);

    const action = fetchUsers();
    store.dispatch(action);

    await store.run(waitForLoader(schema.loaders, action));

    const data = "this is some text";
    expect(actual).toEqual({ ok: true, data, value: data });
  },
);

it(tests, "error handling", async () => {
  const errMsg = { message: "something happened" };
  mock(`GET@/users`, () => {
    return new Response(JSON.stringify(errMsg), { status: 500 });
  });

  const { schema, store } = testStore();
  const api = createApi();
  api.use(mdw.api());
  api.use(storeMdw.store(schema));
  api.use(api.routes());
  api.use(mdw.fetch({ baseUrl }));

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

  store.run(api.bootup);

  const action = fetchUsers();
  store.dispatch(action);

  await store.run(waitForLoader(schema.loaders, action));

  const state = store.getState();
  expect(state.cache[action.payload.key]).toEqual(errMsg);
  expect(actual).toEqual({ ok: false, data: errMsg, error: errMsg });
});

it(tests, "status 204", async () => {
  mock(`GET@/users`, () => {
    return new Response(null, { status: 204 });
  });

  const { schema, store } = testStore();
  const api = createApi();
  api.use(mdw.api());
  api.use(storeMdw.store(schema));
  api.use(api.routes());
  api.use(function* (ctx, next) {
    const url = ctx.req().url;
    ctx.request = ctx.req({ url: `${baseUrl}${url}` });
    yield* next();
  });
  api.use(mdw.fetch());

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

  store.run(api.bootup);

  const action = fetchUsers();
  store.dispatch(action);

  await store.run(waitForLoader(schema.loaders, action));

  const state = store.getState();
  expect(state.cache[action.payload.key]).toEqual({});
  expect(actual).toEqual({ ok: true, data: {}, value: {} });
});

it(tests, "malformed json", async () => {
  mock(`GET@/users`, () => {
    return new Response("not json", { status: 200 });
  });

  const { schema, store } = testStore();
  const api = createApi();
  api.use(mdw.api());
  api.use(storeMdw.store(schema));
  api.use(api.routes());
  api.use(function* (ctx, next) {
    const url = ctx.req().url;
    ctx.request = ctx.req({ url: `${baseUrl}${url}` });
    yield* next();
  });
  api.use(mdw.fetch());

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

  store.run(api.bootup);
  const action = fetchUsers();
  store.dispatch(action);

  await store.run(waitForLoader(schema.loaders, action));

  const data = {
    message: "Unexpected token 'o', \"not json\" is not valid JSON",
  };
  expect(actual).toEqual({
    ok: false,
    data,
    error: data,
  });
});

it(tests, "POST", async () => {
  mock(`POST@/users`, () => {
    return new Response(JSON.stringify(mockUser));
  });

  const { schema, store } = testStore();
  const api = createApi();
  api.use(mdw.api());
  api.use(storeMdw.store(schema));
  api.use(api.routes());
  api.use(mdw.headers);
  api.use(mdw.fetch({ baseUrl }));

  const fetchUsers = api.post(
    "/users",
    { supervisor: takeEvery },
    function* (ctx, next) {
      ctx.cache = true;
      ctx.request = ctx.req({
        body: JSON.stringify(mockUser),
      });
      yield* next();

      ctx.loader = { meta: getTestData(ctx) };
    },
  );

  store.run(api.bootup);
  const action = fetchUsers();
  store.dispatch(action);

  const loader = await store.run(waitForLoader(schema.loaders, action));
  if (!loader.ok) {
    throw loader.error;
  }

  expect(loader.value.meta.request).toEqual({
    url: `${baseUrl}/users`,
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(mockUser),
  });

  expect(loader.value.meta.json).toEqual({
    ok: true,
    data: mockUser,
    value: mockUser,
  });
});

it(tests, "POST multiple endpoints with same uri", async () => {
  mock(`POST@/users/1/something`, () => {
    return new Response(JSON.stringify(mockUser));
  });

  const { store, schema } = testStore();
  const api = createApi();
  api.use(mdw.api());
  api.use(storeMdw.store(schema));
  api.use(api.routes());
  api.use(mdw.headers);
  api.use(mdw.fetch({ baseUrl }));

  const fetchUsers = api.post<{ id: string }>(
    "/users/:id/something",
    { supervisor: takeEvery },
    function* (ctx, next) {
      ctx.cache = true;
      ctx.request = ctx.req({ body: JSON.stringify(mockUser) });
      yield* next();

      ctx.loader = { meta: getTestData(ctx) };
    },
  );

  const fetchUsersSecond = api.post<{ id: string }>(
    ["/users/:id/something", "next"],
    { supervisor: takeEvery },
    function* (ctx, next) {
      ctx.cache = true;
      ctx.request = ctx.req({ body: JSON.stringify(mockUser) });
      yield* next();
      ctx.loader = { meta: getTestData(ctx) };
    },
  );

  store.run(api.bootup);

  const action1 = fetchUsers({ id: "1" });
  const action2 = fetchUsersSecond({ id: "1" });
  store.dispatch(action1);
  store.dispatch(action2);

  const results = await store.run(
    waitForLoaders(schema.loaders, [action1, action2]),
  );
  if (!results.ok) {
    throw results.error;
  }
  const result1 = results.value[0];
  if (!result1.ok) {
    throw result1.error;
  }
  const result2 = results.value[1];
  if (!result2.ok) {
    throw result2.error;
  }

  expect(result1.value.meta.request).toEqual({
    url: `${baseUrl}/users/1/something`,
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(mockUser),
  });

  expect(result1.value.meta.json).toEqual({
    ok: true,
    data: mockUser,
    value: mockUser,
  });

  expect(result2.value.meta.request).toEqual({
    url: `${baseUrl}/users/1/something`,
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(mockUser),
  });

  expect(result2.value.meta.json).toEqual({
    ok: true,
    data: mockUser,
    value: mockUser,
  });
});

it(
  tests,
  "slug in url but payload has empty string for slug value",
  () => {
    const { store, schema } = testStore();
    const api = createApi();
    api.use(mdw.api());
    api.use(storeMdw.store(schema));
    api.use(api.routes());
    api.use(mdw.fetch({ baseUrl }));
    let actual = "";

    const fetchUsers = api.post<{ id: string }>(
      "/users/:id",
      { supervisor: takeEvery },
      function* (ctx, next) {
        ctx.cache = true;
        ctx.request = ctx.req({ body: JSON.stringify(mockUser) });

        yield* next();
        if (!ctx.json.ok) {
          actual = ctx.json.error;
        }
      },
    );

    store.run(api.bootup);
    const action = fetchUsers({ id: "" });
    store.dispatch(action);

    const data =
      "found :id in endpoint name (/users/:id [POST]) but payload has falsy value ()";
    expect(actual).toEqual(data);
  },
);

it(
  tests,
  "with success - should keep retrying fetch request",
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

    const { schema, store } = testStore();
    const api = createApi();
    api.use(mdw.api());
    api.use(storeMdw.store(schema));
    api.use(api.routes());
    api.use(mdw.fetch({ baseUrl }));

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
      mdw.fetchRetry((n) => (n > 4 ? -1 : 10)),
    ]);

    store.run(api.bootup);

    const action = fetchUsers();
    store.dispatch(action);

    const loader = await store.run(waitForLoader(schema.loaders, action));
    if (!loader.ok) {
      throw loader.error;
    }

    const state = store.getState();
    expect(state.cache[action.payload.key]).toEqual(mockUser);
    expect(actual).toEqual({ ok: true, data: mockUser, value: mockUser });
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

    const { schema, store } = testStore();
    let actual = null;
    const api = createApi();
    api.use(mdw.api());
    api.use(storeMdw.store(schema));
    api.use(api.routes());
    api.use(mdw.fetch({ baseUrl }));

    const fetchUsers = api.get("/users", { supervisor: takeEvery }, [
      function* (ctx, next) {
        ctx.cache = true;
        yield* next();
        actual = ctx.json;
      },
      mdw.fetchRetry((n) => (n > 2 ? -1 : 10)),
    ]);

    store.run(api.bootup);
    const action = fetchUsers();
    store.dispatch(action);

    const loader = await store.run(waitForLoader(schema.loaders, action));
    if (!loader.ok) {
      throw loader.error;
    }
    const data = { message: "error" };
    expect(actual).toEqual({ ok: false, data, error: data });
  },
);

it(
  tests,
  "should *not* make http request and instead simply mock response",
  async () => {
    const { schema, store } = testStore();
    let actual = null;
    const api = createApi();
    api.use(mdw.api());
    api.use(storeMdw.store(schema));
    api.use(api.routes());
    api.use(mdw.fetch({ baseUrl }));

    const fetchUsers = api.get("/users", { supervisor: takeEvery }, [
      function* (ctx, next) {
        yield* next();
        actual = ctx.json;
      },
      mdw.response(new Response(JSON.stringify(mockUser))),
    ]);

    store.run(api.bootup);
    store.dispatch(fetchUsers());

    const loader = await store.run(waitForLoader(schema.loaders, fetchUsers));
    if (!loader.ok) {
      throw loader.error;
    }
    expect(actual).toEqual({ ok: true, data: mockUser, value: mockUser });
  },
);

it(tests, "should use dynamic mdw to mock response", async () => {
  const { schema, store } = testStore();
  let actual = null;
  const api = createApi();
  api.use(mdw.api());
  api.use(storeMdw.store(schema));
  api.use(api.routes());
  api.use(mdw.fetch({ baseUrl }));

  const fetchUsers = api.get("/users", { supervisor: takeEvery }, [
    function* (ctx, next) {
      yield* next();
      actual = ctx.json;
    },
    mdw.response(new Response(JSON.stringify(mockUser))),
  ]);

  store.run(api.bootup);

  // override default response with dynamic mdw
  const dynamicUser = { id: "2", email: "dynamic@starfx.com" };
  fetchUsers.use(mdw.response(new Response(JSON.stringify(dynamicUser))));
  store.dispatch(fetchUsers());
  let loader = await store.run(waitForLoader(schema.loaders, fetchUsers));
  if (!loader.ok) {
    throw loader.error;
  }
  expect(actual).toEqual({ ok: true, data: dynamicUser, value: dynamicUser });

  // reset dynamic mdw and try again
  api.reset();
  store.dispatch(fetchUsers());
  loader = await store.run(waitForLoader(schema.loaders, fetchUsers));
  if (!loader.ok) {
    throw loader.error;
  }
  expect(actual).toEqual({ ok: true, data: mockUser, value: mockUser });
});
