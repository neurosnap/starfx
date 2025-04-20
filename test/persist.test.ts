import { call, sleep } from "effection";
import { Ok, Operation, parallel, put, take } from "../mod.ts";
import {
  createPersistor,
  createSchema,
  createStore,
  createTransform,
  PERSIST_LOADER_ID,
  PersistAdapter,
  persistStoreMdw,
  slice,
} from "../store/mod.ts";
import { asserts, describe, it } from "../test.ts";
import type { LoaderItemState } from "../types.ts";

const tests = describe("store");

it(tests, "can persist to storage adapters", async () => {
  const [schema, initialState] = createSchema({
    token: slice.str(),
    loaders: slice.loaders(),
    cache: slice.table({ empty: {} }),
  });
  type State = typeof initialState;
  let ls = "{}";
  const adapter: PersistAdapter<State> = {
    getItem: function* (_: string) {
      return Ok(JSON.parse(ls));
    },
    setItem: function* (_: string, s: Partial<State>) {
      ls = JSON.stringify(s);
      return Ok(undefined);
    },
    removeItem: function* (_: string) {
      return Ok(undefined);
    },
  };
  const persistor = createPersistor<State>({ adapter, allowlist: ["token"] });
  const mdw = persistStoreMdw(persistor);
  const store = createStore({
    initialState,
    middleware: [mdw],
  });

  await store.run(call(function* (): Operation<void> {
    yield* persistor.rehydrate();

    const group = yield* parallel([
      call(function* (): Operation<void> {
        const action = yield* take<string>("SET_TOKEN");
        yield* schema.update(schema.token.set(action.payload));
      }),
      call(function* () {
        yield* put({ type: "SET_TOKEN", payload: "1234" });
      }),
    ]);
    yield* group;
  }));

  asserts.assertEquals(ls, '{"token":"1234"}');
});

it(tests, "rehydrates state", async () => {
  const [schema, initialState] = createSchema({
    token: slice.str(),
    loaders: slice.loaders(),
    cache: slice.table({ empty: {} }),
  });
  type State = typeof initialState;
  let ls = JSON.stringify({ token: "123" });
  const adapter: PersistAdapter<State> = {
    getItem: function* (_: string) {
      return Ok(JSON.parse(ls));
    },
    setItem: function* (_: string, s: Partial<State>) {
      ls = JSON.stringify(s);
      return Ok(undefined);
    },
    removeItem: function* (_: string) {
      return Ok(undefined);
    },
  };
  const persistor = createPersistor<State>({ adapter, allowlist: ["token"] });
  const mdw = persistStoreMdw(persistor);
  const store = createStore({
    initialState,
    middleware: [mdw],
  });

  await store.run(call(function* (): Operation<void> {
    yield* persistor.rehydrate();
    yield* schema.update(schema.loaders.success({ id: PERSIST_LOADER_ID }));
  }));

  asserts.assertEquals(store.getState().token, "123");
});

it(tests, "persists inbound state using transform 'in' function", async () => {
  const [schema, initialState] = createSchema({
    token: slice.str(),
    loaders: slice.loaders(),
    cache: slice.table({ empty: {} }),
  });
  type State = typeof initialState;
  let ls = "{}";

  const adapter: PersistAdapter<State> = {
    getItem: function* (_: string) {
      return Ok(JSON.parse(ls));
    },
    setItem: function* (_: string, s: Partial<State>) {
      ls = JSON.stringify(s);
      return Ok(undefined);
    },
    removeItem: function* (_: string) {
      return Ok(undefined);
    },
  };

  const transform = createTransform<State>();

  transform.in = function (state) {
    return { ...state, token: state?.token?.split("").reverse().join("") };
  };

  const persistor = createPersistor<State>({
    adapter,
    allowlist: ["token", "cache"],
    transform,
  });

  const mdw = persistStoreMdw(persistor);
  const store = createStore({
    initialState,
    middleware: [mdw],
  });

  await store.run(call(function* (): Operation<void> {
    yield* persistor.rehydrate();

    const group = yield* parallel([
      call(function* (): Operation<void> {
        const action = yield* take<string>("SET_TOKEN");
        yield* schema.update(schema.token.set(action.payload));
      }),
      call(function* () {
        yield* put({ type: "SET_TOKEN", payload: "1234" });
      }),
    ]);
    yield* group;
  }));
  asserts.assertEquals(ls, '{"token":"4321","cache":{}}');
});

it(tests, "persists inbound state using tranform in (2)", async () => {
  const [schema, initialState] = createSchema({
    token: slice.str(),
    loaders: slice.loaders(),
    cache: slice.table({ empty: {} }),
  });
  type State = typeof initialState;
  let ls = "{}";

  const adapter: PersistAdapter<State> = {
    getItem: function* (_: string) {
      return Ok(JSON.parse(ls));
    },
    setItem: function* (_: string, s: Partial<State>) {
      ls = JSON.stringify(s);
      return Ok(undefined);
    },
    removeItem: function* (_: string) {
      return Ok(undefined);
    },
  };

  function revertToken(state: Partial<State>) {
    const res = {
      ...state,
      token: state?.token?.split("").reverse().join(""),
    };
    return res;
  }
  const transform = createTransform<State>();
  transform.in = revertToken;

  const persistor = createPersistor<State>({
    adapter,
    allowlist: ["token", "cache"],
    transform,
  });

  const mdw = persistStoreMdw(persistor);
  const store = createStore({
    initialState,
    middleware: [mdw],
  });

  await store.run(call(function* (): Operation<void> {
    yield* persistor.rehydrate();

    const group = yield* parallel([
      call(function* (): Operation<void> {
        const action = yield* take<string>("SET_TOKEN");
        yield* schema.update(schema.token.set(action.payload));
      }),
      call(function* () {
        yield* put({ type: "SET_TOKEN", payload: "1234" });
      }),
    ]);
    yield* group;
  }));
  asserts.assertEquals(ls, '{"token":"4321","cache":{}}');
});

it(tests, "persists a filtered nested part of a slice", async () => {
  const [schema, initialState] = createSchema({
    token: slice.str(),
    loaders: slice.loaders(),
    cache: slice.table({ empty: {} }),
  });
  type State = typeof initialState;
  let ls = "{}";

  const adapter: PersistAdapter<State> = {
    getItem: function* (_: string) {
      return Ok(JSON.parse(ls));
    },
    setItem: function* (_: string, s: Partial<State>) {
      ls = JSON.stringify(s);
      return Ok(undefined);
    },
    removeItem: function* (_: string) {
      return Ok(undefined);
    },
  };

  function pickLatestOfLoadersAandC(state: Partial<State>): Partial<State> {
    const nextState = { ...state };

    if (state.loaders) {
      const maxLastRun: Record<string, number> = {};
      const entryWithMaxLastRun: Record<string, LoaderItemState<any>> = {};

      for (const entryKey in state.loaders) {
        const entry = state.loaders[entryKey] as LoaderItemState<any>;
        const sliceName = entryKey.split("[")[0].trim();
        if (sliceName.includes("A") || sliceName.includes("C")) {
          if (!maxLastRun[sliceName] || entry.lastRun > maxLastRun[sliceName]) {
            maxLastRun[sliceName] = entry.lastRun;
            entryWithMaxLastRun[sliceName] = entry;
          }
        }
      }
      nextState.loaders = entryWithMaxLastRun;
    }
    return nextState;
  }

  const transform = createTransform<State>();
  transform.in = pickLatestOfLoadersAandC;

  const persistor = createPersistor<State>({
    adapter,
    transform,
  });

  const mdw = persistStoreMdw(persistor);
  const store = createStore({
    initialState,
    middleware: [mdw],
  });

  await store.run(call(function* (): Operation<void> {
    yield* persistor.rehydrate();
    const group = yield* parallel([
      call(function* () {
        yield* schema.update(schema.token.set("1234"));
        yield* schema.update(
          schema.loaders.start({
            id: "A [POST]|1234",
            message: "loading A-first",
          }),
        );
        yield* schema.update(schema.loaders.start({ id: "B" }));
        yield* schema.update(schema.loaders.start({ id: "C" }));
        yield* sleep(300);
        yield* schema.update(schema.loaders.success({ id: "A" }));
        yield* schema.update(schema.loaders.success({ id: "B" }));
        yield* schema.update(schema.loaders.success({ id: "C" }));
        yield* schema.update(
          schema.loaders.start({
            id: "A [POST]|5678",
            message: "loading A-second",
          }),
        );
        yield* schema.update(schema.loaders.start({ id: "B" }));
        yield* schema.update(schema.loaders.start({ id: "C" }));
        yield* sleep(300);
        yield* schema.update(schema.loaders.success({ id: "A" }));
        yield* schema.update(schema.loaders.success({ id: "B" }));
        yield* schema.update(schema.loaders.success({ id: "C" }));
        yield* schema.update(schema.token.set("1"));
      }),
    ]);
    yield* group;
  }));
  asserts.assertStringIncludes(ls, '{"token":"1"');
  asserts.assertStringIncludes(ls, '"message":"loading A-second"');
  asserts.assertStringIncludes(ls, '"id":"C"');
  asserts.assertNotMatch(ls, /"message":"loading A-first"/);
  asserts.assertNotMatch(ls, /"id":"B"/);
});

it(tests, "handles the empty state correctly", async () => {
  const [_schema, initialState] = createSchema({
    token: slice.str(),
    loaders: slice.loaders(),
    cache: slice.table({ empty: {} }),
  });

  type State = typeof initialState;
  let ls = "{}";

  const adapter: PersistAdapter<State> = {
    getItem: function* (_: string) {
      return Ok(JSON.parse(ls));
    },
    setItem: function* (_: string, s: Partial<State>) {
      ls = JSON.stringify(s);
      return Ok(undefined);
    },
    removeItem: function* (_: string) {
      return Ok(undefined);
    },
  };

  const transform = createTransform<State>();
  transform.in = function (_: Partial<State>) {
    return {};
  };

  const persistor = createPersistor<State>({
    adapter,
    transform,
  });

  const mdw = persistStoreMdw(persistor);
  const store = createStore({
    initialState,
    middleware: [mdw],
  });

  await store.run(call(function* (): Operation<void> {
    yield* persistor.rehydrate();
  }));

  asserts.assertEquals(ls, "{}");
});

it(
  tests,
  "in absence of the inbound transformer, persists as it is",
  async () => {
    const [schema, initialState] = createSchema({
      token: slice.str(),
      loaders: slice.loaders(),
      cache: slice.table({ empty: {} }),
    });
    type State = typeof initialState;
    let ls = "{}";
    const adapter: PersistAdapter<State> = {
      getItem: function* (_: string) {
        return Ok(JSON.parse(ls));
      },
      setItem: function* (_: string, s: Partial<State>) {
        ls = JSON.stringify(s);
        return Ok(undefined);
      },
      removeItem: function* (_: string) {
        return Ok(undefined);
      },
    };
    const persistor = createPersistor<State>({
      adapter,
      allowlist: ["token"],
      transform: createTransform<State>(), // we deliberately do not set the inbound transformer
    });

    const mdw = persistStoreMdw(persistor);
    const store = createStore({
      initialState,
      middleware: [mdw],
    });

    await store.run(call(function* (): Operation<void> {
      yield* persistor.rehydrate();

      const group = yield* parallel([
        call(function* (): Operation<void> {
          const action = yield* take<string>("SET_TOKEN");
          yield* schema.update(schema.token.set(action.payload));
        }),
        call(function* () {
          yield* put({ type: "SET_TOKEN", payload: "1234" });
        }),
      ]);
      yield* group;
    }));

    asserts.assertEquals(ls, '{"token":"1234"}');
  },
);

it(
  tests,
  "handles errors gracefully, defaluts to identity function",
  async () => {
    const [schema, initialState] = createSchema({
      token: slice.str(),
      loaders: slice.loaders(),
      cache: slice.table({ empty: {} }),
    });
    type State = typeof initialState;
    let ls = "{}";
    const adapter: PersistAdapter<State> = {
      getItem: function* (_: string) {
        return Ok(JSON.parse(ls));
      },
      setItem: function* (_: string, s: Partial<State>) {
        ls = JSON.stringify(s);
        return Ok(undefined);
      },
      removeItem: function* (_: string) {
        return Ok(undefined);
      },
    };

    const transform = createTransform<State>();
    transform.in = function (_: Partial<State>) {
      throw new Error("testing the transform error");
    };
    const persistor = createPersistor<State>({
      adapter,
      transform,
    });
    const mdw = persistStoreMdw(persistor);
    const store = createStore({
      initialState,
      middleware: [mdw],
    });

    await store.run(call(function* (): Operation<void> {
      yield* persistor.rehydrate();
      yield* schema.update(schema.loaders.success({ id: PERSIST_LOADER_ID }));
      yield* schema.update(schema.token.set("1234"));
    }));
    asserts.assertEquals(store.getState().token, "1234");
  },
);

it(
  tests,
  "allowdList is filtered out after the inbound  transformer is applied",
  async () => {
    const [schema, initialState] = createSchema({
      token: slice.str(),
      counter: slice.num(0),
      loaders: slice.loaders(),
      cache: slice.table({ empty: {} }),
    });
    type State = typeof initialState;
    let ls = "{}";
    const adapter: PersistAdapter<State> = {
      getItem: function* (_: string) {
        return Ok(JSON.parse(ls));
      },
      setItem: function* (_: string, s: Partial<State>) {
        ls = JSON.stringify(s);
        return Ok(undefined);
      },
      removeItem: function* (_: string) {
        return Ok(undefined);
      },
    };

    const transform = createTransform<State>();
    transform.in = function (state) {
      return {
        ...state,
        token: `${state.counter}${state?.token?.split("").reverse().join("")}`,
      };
    };

    const persistor = createPersistor<State>({
      adapter,
      allowlist: ["token"],
      transform,
    });

    const mdw = persistStoreMdw(persistor);
    const store = createStore({
      initialState,
      middleware: [mdw],
    });

    await store.run(call(function* (): Operation<void> {
      yield* persistor.rehydrate();
      yield* schema.update(schema.loaders.success({ id: PERSIST_LOADER_ID }));
      yield* schema.update(schema.token.set("1234"));
      yield* schema.update(schema.counter.set(5));
    }));

    asserts.assertEquals(ls, '{"token":"54321"}');
  },
);

it(
  tests,
  "the inbound transformer can be redifined during runtime",
  async () => {
    const [schema, initialState] = createSchema({
      token: slice.str(),
      loaders: slice.loaders(),
      cache: slice.table({ empty: {} }),
    });
    type State = typeof initialState;
    let ls = "{}";
    const adapter: PersistAdapter<State> = {
      getItem: function* (_: string) {
        return Ok(JSON.parse(ls));
      },
      setItem: function* (_: string, s: Partial<State>) {
        ls = JSON.stringify(s);
        return Ok(undefined);
      },
      removeItem: function* (_: string) {
        return Ok(undefined);
      },
    };

    const transform = createTransform<State>();
    transform.in = function (state) {
      return {
        ...state,
        token: `${state?.token?.split("").reverse().join("")}`,
      };
    };

    const persistor = createPersistor<State>({
      adapter,
      allowlist: ["token"],
      transform,
    });

    const mdw = persistStoreMdw(persistor);
    const store = createStore({
      initialState,
      middleware: [mdw],
    });

    await store.run(call(function* (): Operation<void> {
      yield* persistor.rehydrate();
      yield* schema.update(schema.loaders.success({ id: PERSIST_LOADER_ID }));
      yield* schema.update(schema.token.set("01234"));
    }));

    asserts.assertEquals(ls, '{"token":"43210"}');

    transform.in = function (state) {
      return {
        ...state,
        token: `${state?.token}56789`,
      };
    };

    await store.run(call(function* (): Operation<void> {
      yield* schema.update(schema.token.set("01234"));
    }));

    asserts.assertEquals(ls, '{"token":"0123456789"}');
  },
);

it(tests, "persists state using transform 'out' function", async () => {
  const [schema, initialState] = createSchema({
    token: slice.str(),
    counter: slice.num(0),
    loaders: slice.loaders(),
    cache: slice.table({ empty: {} }),
  });
  type State = typeof initialState;
  let ls = '{"token": "01234"}';

  const adapter: PersistAdapter<State> = {
    getItem: function* (_: string) {
      return Ok(JSON.parse(ls));
    },
    setItem: function* (_: string, s: Partial<State>) {
      ls = JSON.stringify(s);
      return Ok(undefined);
    },
    removeItem: function* (_: string) {
      return Ok(undefined);
    },
  };

  function revertToken(state: Partial<State>) {
    return { ...state, token: state?.token?.split("").reverse().join("") };
  }
  const transform = createTransform<State>();
  transform.out = revertToken;

  const persistor = createPersistor<State>({
    adapter,
    allowlist: ["token"],
    transform,
  });

  const mdw = persistStoreMdw(persistor);
  const store = createStore({
    initialState,
    middleware: [mdw],
  });

  await store.run(call(function* (): Operation<void> {
    yield* persistor.rehydrate();
    yield* schema.update(schema.loaders.success({ id: PERSIST_LOADER_ID }));
  }));

  asserts.assertEquals(store.getState().token, "43210");
});

it("persists outbound state using tranform setOutTransformer", async () => {
  const [schema, initialState] = createSchema({
    token: slice.str(),
    counter: slice.num(0),
    loaders: slice.loaders(),
    cache: slice.table({ empty: {} }),
  });
  type State = typeof initialState;
  let ls = '{"token": "43210"}';

  const adapter: PersistAdapter<State> = {
    getItem: function* (_: string) {
      return Ok(JSON.parse(ls));
    },
    setItem: function* (_: string, s: Partial<State>) {
      ls = JSON.stringify(s);
      return Ok(undefined);
    },
    removeItem: function* (_: string) {
      return Ok(undefined);
    },
  };

  function revertToken(state: Partial<State>) {
    return {
      ...state,
      token: ["5"]
        .concat(...(state?.token?.split("") || []))
        .reverse()
        .join(""),
    };
  }
  const transform = createTransform<State>();
  transform.out = revertToken;

  const persistor = createPersistor<State>({
    adapter,
    allowlist: ["token"],
    transform,
  });

  const mdw = persistStoreMdw(persistor);
  const store = createStore({
    initialState,
    middleware: [mdw],
  });

  await store.run(call(function* (): Operation<void> {
    yield* persistor.rehydrate();
    yield* schema.update(schema.loaders.success({ id: PERSIST_LOADER_ID }));
  }));

  asserts.assertEquals(ls, '{"token":"012345"}');
});

it(tests, "persists outbound a filtered nested part of a slice", async () => {
  const [schema, initialState] = createSchema({
    token: slice.str(),
    loaders: slice.loaders(),
    cache: slice.table({ empty: {} }),
  });
  type State = typeof initialState;
  let ls =
    '{"loaders":{"A":{"id":"A [POST]|5678","status":"loading","message":"loading A-second","lastRun":1725048721168,"lastSuccess":0,"meta":{"flag":"01234_FLAG_PERSISTED"}}}}';

  const adapter: PersistAdapter<State> = {
    getItem: function* (_: string) {
      return Ok(JSON.parse(ls));
    },
    setItem: function* (_: string, s: Partial<State>) {
      ls = JSON.stringify(s);
      return Ok(undefined);
    },
    removeItem: function* (_: string) {
      return Ok(undefined);
    },
  };

  function extractMetaAndSetToken(state: Partial<State>): Partial<State> {
    const nextState = { ...state };
    if (state.loaders) {
      const savedLoader = state.loaders["A"];
      if (savedLoader?.meta?.flag) {
        nextState.token = savedLoader.meta.flag;
      }
    }
    return nextState;
  }

  const transform = createTransform<State>();
  transform.out = extractMetaAndSetToken;

  const persistor = createPersistor<State>({
    adapter,
    transform,
  });

  const mdw = persistStoreMdw(persistor);
  const store = createStore({
    initialState,
    middleware: [mdw],
  });

  await store.run(call(function* (): Operation<void> {
    yield* persistor.rehydrate();
    yield* schema.update(schema.loaders.success({ id: PERSIST_LOADER_ID }));
  }));
  asserts.assertEquals(store.getState().token, "01234_FLAG_PERSISTED");
});

it(tests, "the outbound transformer can be reset during runtime", async () => {
  const [schema, initialState] = createSchema({
    token: slice.str(),
    counter: slice.num(0),
    loaders: slice.loaders(),
    cache: slice.table({ empty: {} }),
  });
  type State = typeof initialState;
  let ls = '{"token": "_1234"}';

  const adapter: PersistAdapter<State> = {
    getItem: function* (_: string) {
      return Ok(JSON.parse(ls));
    },
    setItem: function* (_: string, s: Partial<State>) {
      ls = JSON.stringify(s);
      return Ok(undefined);
    },
    removeItem: function* (_: string) {
      return Ok(undefined);
    },
  };

  function revertToken(state: Partial<State>) {
    return { ...state, token: state?.token?.split("").reverse().join("") };
  }
  function postpendToken(state: Partial<State>) {
    return {
      ...state,
      token: `${state?.token}56789`,
    };
  }
  const transform = createTransform<State>();
  transform.out = revertToken;

  const persistor = createPersistor<State>({
    adapter,
    allowlist: ["token"],
    transform,
  });

  const mdw = persistStoreMdw(persistor);
  const store = createStore({
    initialState,
    middleware: [mdw],
  });

  await store.run(call(function* (): Operation<void> {
    yield* persistor.rehydrate();
    yield* schema.update(schema.loaders.success({ id: PERSIST_LOADER_ID }));
  }));

  asserts.assertEquals(store.getState().token, "4321_");

  await store.run(call(function* (): Operation<void> {
    yield* schema.update(schema.token.set("01234"));
  }));

  asserts.assertEquals(ls, '{"token":"01234"}');

  transform.out = postpendToken;

  await store.run(call(function* (): Operation<void> {
    yield* persistor.rehydrate();
    yield* schema.update(schema.loaders.success({ id: PERSIST_LOADER_ID }));
  }));

  asserts.assertEquals(store.getState().token, "0123456789");
});
