import { createPipe } from "../../query/pipe.ts";
import { errorHandler } from "../../query/middleware.ts";
import { apply, takeEvery } from "../fx.ts";
import { parallel } from "../../fx/mod.ts";
import { createTable } from "./table.ts";

import { asserts, describe, it } from "../../test.ts";

import { configureStore } from "../store.ts";
import type { Next } from "../../query/types.ts";
import type {
  ActionWithPayload,
  LoaderCtx,
  ParallelRet,
  PipeCtx,
  Result,
} from "../../mod.ts";
import { Operation } from "../../deps.ts";

const tests = describe("bindStore");

it(tests, "runs basic actions on create table", async () => {
  // Deno.test( "runs basic actions on create table", async () => {
  interface ThunkCtx<P = any, D = any> extends PipeCtx<P>, LoaderCtx<P> {
    actions: ActionWithPayload<P>[];
    json: D | null;
    result: Result<any>;
  }

  const thunks = createPipe<ThunkCtx>();
  thunks.use(errorHandler);
  thunks.use(thunks.routes());

  type TUser = {
    id: string;
    userName: string;
  };

  const REPO_DS_USER = "ds-user";

  const dsUser = createTable<TUser>({
    name: REPO_DS_USER,
    initialState: {},
  });

  const setUser = thunks.create<TUser>(
    "ct/setUser",
    { supervisor: takeEvery },
    function* (ctx: ThunkCtx, next: Next) {
      const mapEntity = (entity: TUser) => ({ [entity.id]: entity });
      yield* apply(dsUser.actions.set(mapEntity(ctx.payload)));
      yield* next();
    },
  );

  const addUser = thunks.create<TUser>(
    "ct/addUser",
    { supervisor: takeEvery },
    function* (ctx: ThunkCtx, next: Next) {
      const mapEntity = (entity: TUser) => ({ [entity.id]: entity });
      yield* apply(dsUser.actions.add(mapEntity(ctx.payload)));
      yield* next();
    },
  );

  const patchUser = thunks.create<TUser>(
    "ct/patchUser",
    { supervisor: takeEvery },
    function* (ctx: ThunkCtx, next: Next) {
      const mapEntity = (entity: TUser) => ({ [entity.id]: entity });
      yield* apply(dsUser.actions.patch(mapEntity(ctx.payload)));
      yield* next();
    },
  );

  const resetUser = thunks.create(
    "ct/resetUser",
    { supervisor: takeEvery },
    function* (_ctx: ThunkCtx, next: Next) {
      yield* apply(dsUser.actions.reset());
      yield* next();
    },
  );

  const removeUser = thunks.create<TUser>(
    "ct/removeUser",
    { supervisor: takeEvery },
    function* (ctx: ThunkCtx, next: Next) {
      yield* apply(dsUser.actions.remove([ctx.payload.id]));
      yield* next();
    },
  );

  const store = await configureStore({
    initialState: {
      [REPO_DS_USER]: dsUser.initialState,
    },
  });

  const runStore = () =>
    store.run(function* () {
      const engine = yield* parallel([
        thunks.bootup,
        //..
      ]) as Operation<ParallelRet<void>>;
      yield* engine;
    });

  runStore();
  store.dispatch(setUser({ id: "1", userName: "user1" }));
  asserts.assertEquals(store.getState()[REPO_DS_USER], {
    1: { id: "1", userName: "user1" },
  });

  store.dispatch(addUser({ id: "2", userName: "user2" }));
  asserts.assertEquals(store.getState()[REPO_DS_USER], {
    1: { id: "1", userName: "user1" },
    2: { id: "2", userName: "user2" },
  });

  store.dispatch(patchUser({ id: "2", userName: "user2-updated" }));
  asserts.assertEquals(store.getState()[REPO_DS_USER], {
    1: { id: "1", userName: "user1" },
    2: { id: "2", userName: "user2-updated" },
  });

  store.dispatch(removeUser({ id: "2", userName: "user2-updated" }));
  asserts.assertEquals(store.getState()[REPO_DS_USER], {
    1: { id: "1", userName: "user1" },
  });

  store.dispatch(resetUser());
  asserts.assertEquals(store.getState()[REPO_DS_USER], dsUser.initialState);
});
