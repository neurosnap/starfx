import { createScope } from "../deps.ts";
import { parallel } from "../fx/mod.ts";
import { asserts, describe, it } from "../test.ts";

import { StoreContext, StoreUpdateContext } from "./context.ts";
import { put, take, updateStore } from "./fx.ts";
import { createStore, register } from "./store.ts";

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
    const scope = createScope();
    const initialState: Partial<State> = {
      users: { 1: { id: "1", name: "testing" }, 2: { id: "2", name: "wow" } },
      dev: false,
    };
    const store = createStore({ scope, initialState });
    await register(store);

    await scope.run(function* (): any {
      const result = yield* parallel([
        function* () {
          const store = yield* StoreContext;
          const chan = yield* StoreUpdateContext;
          const msgList = yield* chan.output;
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
  const scope = createScope();
  const initialState: Partial<State> = {
    users: { 1: { id: "1", name: "testing" }, 2: { id: "2", name: "wow" } },
    dev: false,
    theme: "",
    token: "",
  };
  const store = createStore({ scope, initialState });
  await register(store);

  store.subscribe(() => {
    asserts.assertEquals(store.getState(), {
      users: { 1: { id: "1", name: "eric" }, 3: { id: "", name: "" } },
      theme: "",
      token: "",
      dev: true,
    });
  });

  await scope.run(function* () {
    yield* updateStore(updateUser({ id: "1", name: "eric" }));
  });
});

it(tests, "emit Action and update store", async () => {
  const scope = createScope();
  const initialState: Partial<State> = {
    users: { 1: { id: "1", name: "testing" }, 2: { id: "2", name: "wow" } },
    dev: false,
    theme: "",
    token: "",
  };
  const store = createStore({ scope, initialState });
  await register(store);

  await scope.run(function* (): any {
    const result = yield* parallel([
      function* (): any {
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
