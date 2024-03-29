import { asserts, describe, it } from "../test.ts";
import {
  createPersistor,
  createSchema,
  createStore,
  PERSIST_LOADER_ID,
  PersistAdapter,
  persistStoreMdw,
  slice,
} from "../store/mod.ts";
import { Ok, Operation, parallel, put, take } from "../mod.ts";

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

  await store.run(function* (): Operation<void> {
    yield* persistor.rehydrate();

    const group = yield* parallel([
      function* (): Operation<void> {
        const action = yield* take<string>("SET_TOKEN");
        yield* schema.update(schema.token.set(action.payload));
      },
      function* () {
        yield* put({ type: "SET_TOKEN", payload: "1234" });
      },
    ]);
    yield* group;
  });

  asserts.assertEquals(
    ls,
    '{"token":"1234"}',
  );
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

  await store.run(function* (): Operation<void> {
    yield* persistor.rehydrate();
    yield* schema.update(schema.loaders.success({ id: PERSIST_LOADER_ID }));
  });

  asserts.assertEquals(
    store.getState().token,
    "123",
  );
});
