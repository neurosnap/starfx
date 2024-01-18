import { assertLike, asserts, describe, it } from "../test.ts";
import { configureStore } from "../store/mod.ts";
import { put, takeEvery } from "../action.ts";
import { call, sleep as delay } from "../deps.ts";
import { sleep } from "../test.ts";
import { createThunks } from "./thunk.ts";
import type { Next, ThunkCtx } from "./types.ts";
import { updateStore } from "../store/fx.ts";

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

const tests = describe("createThunks()");

it(
  tests,
  "when create a query fetch pipeline - execute all middleware and save to redux",
  () => {
    const api = createThunks<RoboCtx>();
    api.use(api.routes());
    api.use(convertNameToUrl);
    api.use(onFetchApi);
    api.use(processUsers);
    api.use(processTickets);
    const fetchUsers = api.create(`/users`, { supervisor: takeEvery });

    const store = configureStore<TestState>({
      initialState: { users: {}, tickets: {} },
    });
    store.run(api.bootup);

    store.dispatch(fetchUsers());

    asserts.assertEquals(store.getState(), {
      users: { [mockUser.id]: deserializeUser(mockUser) },
      tickets: {},
    });
  },
);

it(
  tests,
  "when providing a generator the to api.create function - should call that generator before all other middleware",
  () => {
    const api = createThunks<RoboCtx>();
    api.use(api.routes());
    api.use(convertNameToUrl);
    api.use(onFetchApi);
    api.use(processUsers);
    api.use(processTickets);
    const fetchUsers = api.create(`/users`, { supervisor: takeEvery });
    const fetchTickets = api.create(`/ticket-wrong-url`, {
      supervisor: takeEvery,
    }, function* (ctx, next) {
      // before middleware has been triggered
      ctx.url = "/tickets";

      // triggers all middleware
      yield* next();

      yield* put(fetchUsers());
    });

    const store = configureStore<TestState>({
      initialState: { users: {}, tickets: {} },
    });
    store.run(api.bootup);

    store.dispatch(fetchTickets());
    asserts.assertEquals(store.getState(), {
      users: { [mockUser.id]: deserializeUser(mockUser) },
      tickets: { [mockTicket.id]: deserializeTicket(mockTicket) },
    });
  },
);

it(tests, "error handling", () => {
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

  const action = api.create(`/error`, { supervisor: takeEvery });

  const store = configureStore({ initialState: {} });
  store.run(api.bootup);
  store.dispatch(action());
  asserts.assertStrictEquals(called, true);
});

it(tests, "error handling inside create", () => {
  let called = false;
  const api = createThunks<RoboCtx>();
  api.use(api.routes());
  api.use(function* fail() {
    throw new Error("some error");
  });

  const action = api.create(
    `/error`,
    { supervisor: takeEvery },
    function* (_, next) {
      try {
        yield* next();
      } catch (_) {
        called = true;
      }
    },
  );
  const store = configureStore({ initialState: {} });
  store.run(api.bootup);
  store.dispatch(action());
  asserts.assertStrictEquals(called, true);
});

it(tests, "error inside endpoint mdw", () => {
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
    `/users`,
    { supervisor: takeEvery },
    function* processUsers() {
      throw new Error("some error");
    },
  );

  const store = configureStore({
    initialState: {
      users: {},
    },
  });
  store.run(query.bootup);
  store.dispatch(fetchUsers());
  asserts.assertEquals(called, true);
});

it(tests, "create fn is an array", () => {
  const api = createThunks<RoboCtx>();
  api.use(api.routes());
  api.use(function* (ctx, next) {
    asserts.assertEquals(ctx.request, {
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

  const store = configureStore({ initialState: {} });
  store.run(api.bootup);
  store.dispatch(action());
});

it(tests, "run() on endpoint action - should run the effect", () => {
  const api = createThunks<RoboCtx>();
  api.use(api.routes());
  let acc = "";
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
      const curCtx = yield* call(() => action1.run(action1()));
      acc += "b";
      asserts.assert(acc === "ab");
      assertLike(curCtx, {
        action: {
          type: `@@starfx${action1}`,
          payload: {
            name: "/users",
          },
        },
        name: "/users",
        request: { method: "expect this" },
      });
    },
  );

  const store = configureStore({ initialState: {} });
  store.run(api.bootup);
  store.dispatch(action2());
});

it(
  tests,
  "run() on endpoint action with payload - should run the effect",
  () => {
    const api = createThunks<RoboCtx>();
    api.use(api.routes());
    let acc = "";
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
        const curCtx = yield* action1.run({ id: "1" });
        acc += "b";
        asserts.assert(acc === "ab");
        assertLike(curCtx, {
          action: {
            type: `@@starfx${action1}`,
            payload: {
              name: "/users",
            },
          },
          name: "/users",
          request: { method: "expect this" },
        });
      },
    );

    const store = configureStore({ initialState: {} });
    store.run(api.bootup);
    store.dispatch(action2());
  },
);

it(tests, "middleware order of execution", async () => {
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
    },
  );

  const store = configureStore({ initialState: {} });
  store.run(api.bootup);
  store.dispatch(action());

  await sleep(150);
  asserts.assert(acc === "abcdefg");
});

it(tests, "retry with actionFn", async () => {
  let acc = "";
  let called = false;

  const api = createThunks();
  api.use(api.routes());

  const action = api.create(
    "/api",
    { supervisor: takeEvery },
    function* (ctx, next) {
      acc += "a";
      yield* next();
      acc += "g";

      if (!called) {
        called = true;
        yield* put(ctx.actionFn());
      }
    },
  );

  const store = configureStore({ initialState: {} });
  store.run(api.bootup);
  store.dispatch(action());

  await sleep(150);
  asserts.assertEquals(acc, "agag");
});

it(tests, "retry with actionFn with payload", async () => {
  let acc = "";
  const api = createThunks();
  api.use(api.routes());

  api.use(function* (ctx: ThunkCtx<{ page: number }>, next) {
    yield* next();
    if (ctx.payload.page == 1) {
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

  const store = configureStore({ initialState: {} });
  store.run(api.bootup);
  store.dispatch(action({ page: 1 }));

  await sleep(150);
  asserts.assertEquals(acc, "agag");
});

it(tests, "should only call thunk once", () => {
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

  const store = configureStore({ initialState: {} });
  store.run(api.bootup);
  store.dispatch(action2());
  asserts.assertEquals(acc, "a");
});
