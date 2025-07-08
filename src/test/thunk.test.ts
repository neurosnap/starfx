import { API_ACTION_PREFIX } from "../action.js";
import {
  call,
  createThunks,
  sleep as delay,
  put,
  resource,
  takeEvery,
  waitFor,
} from "../index.js";
import { createStore, updateStore } from "../store/index.js";
import { describe, expect, test } from "../test.js";

import type { Next, Operation, ThunkCtx } from "../index.js";
// deno-lint-ignore no-explicit-any
interface RoboCtx<D = Record<string, unknown>, P = any> extends ThunkCtx<P> {
  url: string;
  request: { method: string; body?: Record<string, unknown> };
  response: D;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserResponse {
  id: string;
  name: string;
  email_address: string;
}

const deserializeUser = (u: UserResponse): User => {
  return {
    id: u.id,
    name: u.name,
    email: u.email_address,
  };
};

interface Ticket {
  id: string;
  name: string;
}

interface TicketResponse {
  id: string;
  name: string;
}

const deserializeTicket = (u: TicketResponse): Ticket => {
  return {
    id: u.id,
    name: u.name,
  };
};

interface TestState {
  users: { [key: string]: User };
  tickets: { [key: string]: Ticket };
}

const mockUser = { id: "1", name: "test", email_address: "test@test.com" };
const mockTicket = { id: "2", name: "test-ticket" };

function* convertNameToUrl(ctx: RoboCtx, next: Next) {
  if (!ctx.url) {
    ctx.url = ctx.name;
  }
  yield* next();
}

function* onFetchApi(ctx: RoboCtx, next: Next) {
  const url = ctx.url;
  let json = {};
  if (url === "/users") {
    json = {
      users: [mockUser],
    };
  }

  if (url === "/tickets") {
    json = {
      tickets: [mockTicket],
    };
  }

  ctx.response = json;
  yield* next();
}

function* processUsers(ctx: RoboCtx<{ users?: UserResponse[] }>, next: Next) {
  if (!ctx.response.users) {
    yield* next();
    return;
  }
  yield* updateStore<TestState>((state) => {
    if (!ctx.response.users) return;
    ctx.response.users.forEach((u) => {
      state.users[u.id] = deserializeUser(u);
    });
  });

  yield* next();
}

function* processTickets(
  ctx: RoboCtx<{ tickets?: UserResponse[] }>,
  next: Next,
) {
  if (!ctx.response.tickets) {
    yield* next();
    return;
  }
  yield* updateStore<TestState>((state) => {
    if (!ctx.response.tickets) return;
    ctx.response.tickets.forEach((u) => {
      state.tickets[u.id] = deserializeTicket(u);
    });
  });

  yield* next();
}

test("when create a query fetch pipeline - execute all middleware and save to redux", () => {
  expect.assertions(1);
  const api = createThunks<RoboCtx>();
  api.use(api.routes());
  api.use(convertNameToUrl);
  api.use(onFetchApi);
  api.use(processUsers);
  api.use(processTickets);
  const fetchUsers = api.create("/users", { supervisor: takeEvery });

  const store = createStore<TestState>({
    initialState: { users: {}, tickets: {} },
  });
  store.run(api.register);

  store.dispatch(fetchUsers());

  expect(store.getState()).toEqual({
    users: { [mockUser.id]: deserializeUser(mockUser) },
    tickets: {},
  });
});

test("when providing a generator the to api.create function - should call that generator before all other middleware", () => {
  expect.assertions(1);
  const api = createThunks<RoboCtx>();
  api.use(api.routes());
  api.use(convertNameToUrl);
  api.use(onFetchApi);
  api.use(processUsers);
  api.use(processTickets);
  const fetchUsers = api.create("/users", { supervisor: takeEvery });
  const fetchTickets = api.create(
    "/ticket-wrong-url",
    {
      supervisor: takeEvery,
    },
    function* (ctx, next) {
      // before middleware has been triggered
      ctx.url = "/tickets";

      // triggers all middleware
      yield* next();

      yield* put(fetchUsers());
    },
  );

  const store = createStore<TestState>({
    initialState: { users: {}, tickets: {} },
  });
  store.run(api.register);

  store.dispatch(fetchTickets());
  expect(store.getState()).toEqual({
    users: { [mockUser.id]: deserializeUser(mockUser) },
    tickets: { [mockTicket.id]: deserializeTicket(mockTicket) },
  });
});

test("error handling", () => {
  expect.assertions(1);
  let called;
  const api = createThunks<RoboCtx>();
  api.use(api.routes());
  api.use(function* upstream(_, next) {
    try {
      yield* next();
    } catch (_) {
      called = true;
    }
  });
  api.use(function* fail() {
    throw new Error("some error");
  });

  const action = api.create("/error", { supervisor: takeEvery });

  const store = createStore({ initialState: {} });
  store.run(api.register);
  store.dispatch(action());
  expect(called).toBe(true);
});

test("error handling inside create", () => {
  expect.assertions(1);
  let called = false;
  const api = createThunks<RoboCtx>();
  api.use(api.routes());
  api.use(function* fail() {
    throw new Error("some error");
  });

  const action = api.create(
    "/error",
    { supervisor: takeEvery },
    function* (_, next) {
      try {
        yield* next();
      } catch (_) {
        called = true;
      }
    },
  );
  const store = createStore({ initialState: {} });
  store.run(api.register);
  store.dispatch(action());
  expect(called).toBe(true);
});

test("error inside endpoint mdw", () => {
  expect.assertions(1);
  let called = false;
  const query = createThunks();
  query.use(function* (_, next) {
    try {
      yield* next();
    } catch (_) {
      called = true;
    }
  });

  query.use(query.routes());

  const fetchUsers = query.create(
    "/users",
    { supervisor: takeEvery },
    function* processUsers() {
      throw new Error("some error");
    },
  );

  const store = createStore({
    initialState: {
      users: {},
    },
  });
  store.run(query.register);
  store.dispatch(fetchUsers());
  expect(called).toBe(true);
});

test("create fn is an array", () => {
  expect.assertions(1);
  const api = createThunks<RoboCtx>();
  api.use(api.routes());
  api.use(function* (ctx, next) {
    expect(ctx.request).toEqual({
      method: "POST",
      body: {
        test: "me",
      },
    });
    yield* next();
  });
  const action = api.create("/users", { supervisor: takeEvery }, [
    function* (ctx, next) {
      ctx.request = {
        method: "POST",
      };
      yield* next();
    },
    function* (ctx, next) {
      ctx.request.body = { test: "me" };
      yield* next();
    },
  ]);

  const store = createStore({ initialState: {} });
  store.run(api.register);
  store.dispatch(action());
});

test("run() on endpoint action - should run the effect", () => {
  expect.assertions(4);
  const api = createThunks<RoboCtx>();
  api.use(api.routes());

  let acc = "";
  let curCtx: RoboCtx = {} as RoboCtx;

  const action1 = api.create(
    "/users",
    { supervisor: takeEvery },
    function* (ctx, next) {
      yield* next();
      ctx.request = { method: "expect this" };
      acc += "a";
    },
  );
  const action2 = api.create(
    "/users2",
    { supervisor: takeEvery },
    function* (_, next) {
      yield* next();
      curCtx = yield* call(() => action1.run(action1()));
      acc += "b";
    },
  );

  const store = createStore({ initialState: {} });
  store.run(api.register);
  store.dispatch(action2());
  expect(acc).toBe("ab");
  expect(curCtx.action).toMatchObject({
    type: `${API_ACTION_PREFIX}${action1}`,
    payload: {
      name: "/users",
    },
  });
  expect(curCtx.name).toBe("/users");
  expect(curCtx.request).toEqual({ method: "expect this" });
});

test("run() on endpoint action with payload - should run the effect", () => {
  expect.assertions(4);
  const api = createThunks<RoboCtx>();
  api.use(api.routes());

  let acc = "";
  let curCtx: RoboCtx = {} as RoboCtx;

  const action1 = api.create<{ id: string }>(
    "/users",
    { supervisor: takeEvery },
    function* (ctx, next) {
      yield* next();
      ctx.request = { method: "expect this" };
      acc += "a";
    },
  );
  const action2 = api.create(
    "/users2",
    { supervisor: takeEvery },
    function* (_, next) {
      yield* next();
      curCtx = yield* call(() => action1.run({ id: "1" }));
      acc += "b";
    },
  );

  const store = createStore({ initialState: {} });
  store.run(api.register);
  store.dispatch(action2());
  expect(acc).toBe("ab");
  expect(curCtx.action).toMatchObject({
    type: `${API_ACTION_PREFIX}${action1}`,
    payload: {
      name: "/users",
    },
  });
  expect(curCtx.name).toBe("/users");
  expect(curCtx.request).toEqual({ method: "expect this" });
});

test("middleware order of execution", async () => {
  expect.assertions(1);
  let acc = "";
  const api = createThunks();
  api.use(api.routes());

  api.use(function* (_, next) {
    yield* delay(10);
    acc += "b";
    yield* next();
    yield* delay(10);
    acc += "f";
  });

  api.use(function* (_, next) {
    acc += "c";
    yield* next();
    acc += "d";
    yield* delay(30);
    acc += "e";
  });

  const action = api.create(
    "/api",
    { supervisor: takeEvery },
    function* (_, next) {
      acc += "a";
      yield* next();
      acc += "g";
      yield* put({ type: "DONE" });
    },
  );

  const store = createStore({ initialState: {} });
  store.run(api.register);
  store.dispatch(action());

  await store.run(waitFor(() => acc === "abcdefg"));
  expect(acc).toBe("abcdefg");
});

test("retry with actionFn", async () => {
  expect.assertions(1);
  let acc = "";
  let called = false;

  const api = createThunks();
  api.use(api.routes());

  const action = api.create("/api", function* (ctx, next) {
    acc += "a";
    yield* next();
    acc += "g";
    if (acc === "agag") {
      yield* put({ type: "DONE" });
    }

    if (!called) {
      called = true;
      yield* put(ctx.actionFn());
    }
  });

  const store = createStore({ initialState: {} });
  store.run(api.register);
  store.dispatch(action());

  await store.run(waitFor(() => acc === "agag"));
  expect(acc).toBe("agag");
});

test("retry with actionFn with payload", async () => {
  expect.assertions(1);
  let acc = "";
  const api = createThunks();
  api.use(api.routes());

  api.use(function* (ctx: ThunkCtx<{ page: number }>, next) {
    yield* next();
    if (ctx.payload.page === 1) {
      yield* put(ctx.actionFn({ page: 2 }));
    }
  });

  const action = api.create<{ page: number }>(
    "/api",
    { supervisor: takeEvery },
    function* (_, next) {
      acc += "a";
      yield* next();
      acc += "g";
    },
  );

  const store = createStore({ initialState: {} });
  store.run(api.register);
  store.dispatch(action({ page: 1 }));

  await store.run(waitFor(() => acc === "agag"));
  expect(acc).toBe("agag");
});

test("should only call thunk once", () => {
  expect.assertions(1);
  const api = createThunks<RoboCtx>();
  api.use(api.routes());
  let acc = "";

  const action1 = api.create<number>(
    "/users",
    { supervisor: takeEvery },
    function* (_, next) {
      yield* next();
      acc += "a";
    },
  );
  const action2 = api.create(
    "/users2",
    { supervisor: takeEvery },
    function* (_, next) {
      yield* next();
      yield* put(action1(1));
    },
  );

  const store = createStore({ initialState: {} });
  store.run(api.register);
  store.dispatch(action2());
  expect(acc).toBe("a");
});

test("should be able to create thunk after `register()`", () => {
  expect.assertions(1);
  const api = createThunks<RoboCtx>();
  api.use(api.routes());
  const store = createStore({ initialState: {} });
  store.run(api.register);

  let acc = "";
  const action = api.create("/users", function* () {
    acc += "a";
  });
  store.dispatch(action());
  expect(acc).toBe("a");
});

test("should warn when calling thunk before registered", () => {
  expect.assertions(1);
  const err = console.warn;
  let called = false;
  console.warn = () => {
    called = true;
  };
  const api = createThunks<RoboCtx>();
  api.use(api.routes());
  const store = createStore({ initialState: {} });

  const action = api.create("/users");
  store.dispatch(action());
  expect(called).toBe(true);
  console.warn = err;
});

test("it should call the api once even if we register it twice", () => {
  expect.assertions(1);
  const api = createThunks<RoboCtx>();
  api.use(api.routes());
  const store = createStore({ initialState: {} });
  store.run(api.register);
  store.run(api.register);

  let acc = "";
  const action = api.create("/users", function* () {
    acc += "a";
  });
  store.dispatch(action());
  expect(acc).toBe("a");
});

test("should call the API only once, even if registered multiple times, with multiple APIs defined.", () => {
  expect.assertions(2);
  const api1 = createThunks<RoboCtx>();
  api1.use(api1.routes());

  const api2 = createThunks<RoboCtx>();
  api2.use(api2.routes());

  const store = createStore({ initialState: {} });

  store.run(api1.register);
  store.run(api1.register);
  store.run(api1.register);

  store.run(api2.register);
  store.run(api2.register);

  let acc = "";
  const action = api1.create("/users", function* () {
    acc += "b";
  });
  store.dispatch(action());

  expect(acc).toBe("b");

  let acc2 = "";
  const action2 = api2.create("/users", function* () {
    acc2 += "c";
  });
  store.dispatch(action2());

  expect(acc2).toBe("c");
});

test("should unregister the thunk when the registration function exits", async () => {
  expect.assertions(1);
  const api1 = createThunks<RoboCtx>();
  api1.use(api1.routes());

  const store = createStore({ initialState: {} });
  const task = store.run(api1.register);
  await task.halt();
  store.run(api1.register);

  let acc = "";
  const action = api1.create("/users", function* () {
    acc += "b";
  });
  store.dispatch(action());

  expect(acc).toBe("b");
});

test("should allow multiple stores to register a thunk", () => {
  expect.assertions(1);
  const api1 = createThunks<RoboCtx>();
  api1.use(api1.routes());
  const storeA = createStore({ initialState: {} });
  const storeB = createStore({ initialState: {} });
  storeA.run(api1.register);
  storeB.run(api1.register);
  let acc = "";
  const action = api1.create("/users", function* () {
    acc += "b";
  });
  storeA.dispatch(action());
  storeB.dispatch(action());

  expect(acc).toBe("bb");
});

describe(".manage", () => {
  function guessAge(): Operation<{ guess: number }> {
    return resource(function* (provide) {
      yield* provide({
        get guess() {
          return Math.floor(Math.random() * 100);
        },
      });
    });
  }

  test("starts without error", () => {
    expect.assertions(1);

    const thunk = createThunks<RoboCtx>();
    thunk.use(thunk.routes());
    const TestContext = thunk.manage("test:context", guessAge());
    const store = createStore({ initialState: {} });
    store.run(thunk.register);
    let acc = "";
    const action = thunk.create("/users", function* (payload, next) {
      acc += "b";
      next();
    });
    store.dispatch(action());

    expect(acc).toBe("b");
  });

  test("expects resource", () => {
    expect.assertions(1);

    const thunk = createThunks<RoboCtx>();
    thunk.use(thunk.routes());
    const TestContext = thunk.manage("test:context", guessAge());
    const store = createStore({ initialState: {} });
    store.run(thunk.register);
    let acc = "";
    const action = thunk.create("/users", function* (payload, next) {
      const c = yield* TestContext.expect();
      if (c) acc += "b";
      next();
    });
    store.dispatch(action());

    expect(acc).toBe("b");
  });

  test("uses resource", () => {
    expect.assertions(1);

    const thunk = createThunks<RoboCtx>();
    thunk.use(thunk.routes());
    const TestContext = thunk.manage("test:context", guessAge());
    const store = createStore({ initialState: {} });
    store.run(thunk.register);
    let acc = 0;
    const action = thunk.create("/users", function* (payload, next) {
      const c = yield* TestContext.expect();
      acc += c.guess;
      next();
    });
    store.dispatch(action());

    expect(acc).toBeGreaterThan(0);
  });
});
