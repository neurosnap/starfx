import { asserts, describe, it } from "../test.ts";
import {
  createStore,
  StoreContext,
  StoreUpdateContext,
  updateStore,
} from "../store/mod.ts";
import { createScope, Operation, parallel, put, Result, take } from "../mod.ts";
import * as Y from "npm:yjs";

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

const yjsProduceNextState = <Y extends Y.Doc>(state: Y, upds: any[]) => {
  const t = state.transact(() => {
    upds.forEach((updater) => updater());
  });

  return { nextState: t, patches: {} };
};

const updateUser =
  ({ id, name }: UpdateUserProps) =>
  (state: State) => {
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
    const ydoc = new Y.Doc();
    const initialState: Partial<State> = {
      users: { 1: { id: "1", name: "testing" }, 2: { id: "2", name: "wow" } },
      dev: false,
    };
    createStore({
      scope,
      initialState: ydoc,
      determineNextState: yjsProduceNextState,
    });

    const boop = await scope.run(function* (): Operation<Result<void>[]> {
      const result = yield* parallel([
        function* () {
          const store = yield* StoreContext;
          const chan = yield* StoreUpdateContext;
          const msgList = yield* chan.subscribe();
          yield* msgList.next();
          asserts.assertEquals(store.getState().getMap("users").toJSON(), {
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
    asserts.assertEquals(boop, undefined);
  }
);

it.only(
  tests,
  "update store and receives update from `subscribe()`",
  async () => {
    const ydoc = new Y.Doc();
    const statesnapshot = [] as { [x: string]: any }[];

    // const initialState: Partial<State> = {
    //   users: { 1: { id: "1", name: "testing" }, 2: { id: "2", name: "wow" } },
    //   dev: false,
    //   theme: "",
    //   token: "",
    // };
    const store = createStore({ initialState: ydoc });

    store.subscribe(() => {
      statesnapshot.push(store.getState().getMap("users").toJSON());
    });

    await store.run(function* () {
      yield* updateStore(updateUser({ id: "1", name: "eric" }));
    });

    asserts.assertArrayIncludes(statesnapshot, {
      // @ts-expect-error boop
      users: { 1: { id: "1", name: "eric" }, 3: { id: "", name: "" } },
    });
  }
);

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
