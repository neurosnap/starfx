import { asserts, describe, it } from "../../test.ts";
import { configureStore, updateStore } from "../mod.ts";

import { createObj } from "./obj.ts";
const tests = describe("createObj()");

export interface ICurrentUser {
  username: string;
  userId: number;
  isadmin: boolean;
  roles: string[];
}

const NAME = "currentUser";
const crtInitialState = {
  username: "",
  userId: 0,
  isadmin: false,
  roles: [],
};

const slice = createObj<ICurrentUser>({
  name: NAME,
  initialState: crtInitialState,
});

it(tests, "sets up an obj", async () => {
  const store = configureStore({
    initialState: {
      [NAME]: crtInitialState,
    },
  });

  await store.run(function* () {
    yield* updateStore(
      slice.set({
        username: "bob",
        userId: 1,
        isadmin: true,
        roles: ["admin", "user"],
      }),
    );
  });

  asserts.assertEquals(store.getState()["currentUser"], {
    username: "bob",
    userId: 1,
    isadmin: true,
    roles: ["admin", "user"],
  });

  await store.run(function* () {
    yield* updateStore(slice.update({ key: "username", value: "alice" }));
  });

  asserts.assertEquals(store.getState()["currentUser"], {
    username: "alice",
    userId: 1,
    isadmin: true,
    roles: ["admin", "user"],
  });

  await store.run(function* () {
    yield* updateStore(
      slice.update({ key: "roles", value: ["admin", "superuser"] }),
    );
  });

  asserts.assertEquals(store.getState()["currentUser"], {
    username: "alice",
    userId: 1,
    isadmin: true,
    roles: ["admin", "superuser"],
  });
});
