import { configureStore, updateStore } from "../../../store/index.js";
import { expect, test } from "../../../test.js";

import { createObj } from "../../../store/slice/obj.js";

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

test("sets up an obj", async () => {
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

  expect(store.getState().currentUser).toEqual({
    username: "bob",
    userId: 1,
    isadmin: true,
    roles: ["admin", "user"],
  });

  await store.run(function* () {
    yield* updateStore(slice.update({ key: "username", value: "alice" }));
  });

  expect(store.getState().currentUser).toEqual({
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

  expect(store.getState().currentUser).toEqual({
    username: "alice",
    userId: 1,
    isadmin: true,
    roles: ["admin", "superuser"],
  });
});
