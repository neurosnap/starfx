import { asserts, describe, it } from "../test.ts";
import {
  createStore,
  StoreContext,
  StoreUpdateContext,
  updateStore,
} from "../store/mod.ts";
import { createScope, Operation, parallel, put, Result, take } from "../mod.ts";

const tests = describe("store");

interface User {
  id: string;
  name: string;
}

interface State {
  users: { [key: string]: User };
  theme: string;
  token: string;
  dev: boolean;
}

function findUserById(state: State, { id }: { id: string }) {
  return state.users[id];
}

function findUsers(state: State) {
  return state.users;
}

interface UpdateUserProps {
  id: string;
  name: string;
}

const updateUser = ({ id, name }: UpdateUserProps) => (state: State) => {
  // use selectors to find the data you want to mutate
  const user = findUserById(state, { id });
  user.name = name;

  // different ways to update a `zod` record
  const users = findUsers(state);
  users[id].name = name;

  delete users[2];
  users[3] = { id: "", name: "" };

  // or mutate state directly without selectors
  state.dev = true;
};

it(
  tests,
  "update store and receives update from channel `StoreUpdateContext`",
  async () => {
    const [scope] = createScope();
    const initialState: Partial<State> = {
      users: { 1: { id: "1", name: "testing" }, 2: { id: "2", name: "wow" } },
      dev: false,
    };
    createStore({ scope, initialState });

    await scope.run(function* (): Operation<Result<void>[]> {
      const result = yield* parallel([
        function* () {
          const store = yield* StoreContext;
          const chan = yield* StoreUpdateContext;
          const msgList = yield* chan.subscribe();
          yield* msgList.next();
          asserts.assertEquals(store.getState(), {
            users: { 1: { id: "1", name: "eric" }, 3: { id: "", name: "" } },
            theme: "",
            token: null,
            dev: true,
          });
        },

        function* () {
          yield* updateStore(updateUser({ id: "1", name: "eric" }));
        },
      ]);

      return yield* result;
    });
  },
);

it(tests, "update store and receives update from `subscribe()`", async () => {
  const initialState: Partial<State> = {
    users: { 1: { id: "1", name: "testing" }, 2: { id: "2", name: "wow" } },
    dev: false,
    theme: "",
    token: "",
  };
  const store = createStore({ initialState });

  store.subscribe(() => {
    asserts.assertEquals(store.getState(), {
      users: { 1: { id: "1", name: "eric" }, 3: { id: "", name: "" } },
      dev: true,
      theme: "",
      token: "",
    });
  });

  await store.run(function* () {
    yield* updateStore(updateUser({ id: "1", name: "eric" }));
  });
});

it(tests, "emit Action and update store", async () => {
  const initialState: Partial<State> = {
    users: { 1: { id: "1", name: "testing" }, 2: { id: "2", name: "wow" } },
    dev: false,
    theme: "",
    token: "",
  };
  const store = createStore({ initialState });

  await store.run(function* (): Operation<void> {
    const result = yield* parallel([
      function* (): Operation<void> {
        const action = yield* take<UpdateUserProps>("UPDATE_USER");
        yield* updateStore(updateUser(action.payload));
      },
      function* () {
        yield* put({ type: "UPDATE_USER", payload: { id: "1", name: "eric" } });
      },
    ]);
    yield* result;
  });

  asserts.assertEquals(store.getState(), {
    users: { 1: { id: "1", name: "eric" }, 3: { id: "", name: "" } },
    theme: "",
    token: "",
    dev: true,
  });
});

it(tests, "resets store", async () => {
  const initialState: Partial<State> = {
    users: { 1: { id: "1", name: "testing" }, 2: { id: "2", name: "wow" } },
    dev: false,
    theme: "",
    token: "",
  };
  const store = createStore({ initialState });

  await store.run(function* () {
    yield* store.update((s) => {
      s.users = { 3: { id: "3", name: "hehe" } };
      s.dev = true;
      s.theme = "darkness";
    });
  });

  asserts.assertEquals(store.getState(), {
    users: { 3: { id: "3", name: "hehe" } },
    theme: "darkness",
    token: "",
    dev: true,
  });

  await store.run(store.reset(["users"]));

  asserts.assertEquals(store.getState(), {
    users: { 3: { id: "3", name: "hehe" } },
    dev: false,
    theme: "",
    token: "",
  });
});
