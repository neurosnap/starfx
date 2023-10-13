/* import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "https://esm.sh/@testing-library/react@14.0.0?pin=v122";

import { React } from "../deps.ts";
import { asserts, beforeEach, describe, it } from "../test.ts";
import { Provider, sleep as delay, useSelector } from "../deps.ts";
import { configureStore, updateStore } from "../store/mod.ts";

import { createApi } from "./api.ts";
import { requestMonitor } from "./middleware.ts";
import { useApi } from "./react.ts";
import { selectDataById } from "./slice.ts";
import { createKey } from "./create-key.ts";

const h = React.createElement;

const mockUser = { id: "1", email: "test@starfx.com" };

const jsonBlob = (data: any) => {
  return JSON.stringify(data);
};

interface User {
  id: string;
  name: string;
  email: string;
}

const setupTest = async () => {
  const api = createApi();
  api.use(requestMonitor());
  api.use(api.routes());
  api.use(function* (ctx, next) {
    yield* delay(10);
    ctx.json = { ok: true, data: mockUser };
    ctx.response = new Response(jsonBlob(mockUser), { status: 200 });
    yield* next();
  });

  const fetchUser = api.get<{ id: string }>("/user/:id", function* (ctx, next) {
    ctx.cache = true;
    yield* next();
    if (!ctx.json.ok) return;
    yield* updateStore<{ user: User }>((state) => {
      state.user = ctx.json.data;
    });
  });

  const store = configureStore<{ user?: User }>({
    initialState: {},
  });
  store.run(api.bootup);

  return { store, fetchUser, api };
};

describe.ignore("useApi()", () => {
  beforeEach(() => cleanup());
  it("with action", async () => {
    const { fetchUser, store } = await setupTest();
    const App = () => {
      const action = fetchUser({ id: "1" });
      const query = useApi(action);
      const user = useSelector((s: any) =>
        selectDataById(s, { id: action.payload.key })
      ) as User;

      return h("div", null, [
        h("div", { key: "1" }, user?.email || ""),
        h(
          "button",
          { key: "2", onClick: () => query.trigger() },
          query.isLoading ? "loading" : "fetch",
        ),
        h("div", { key: "3" }, query.isSuccess ? "success" : ""),
      ]);
    };
    // render(h(Provider, { store, children: h(App) }));

    const button = screen.getByText("fetch");
    fireEvent.click(button);

    await screen.findByText("loading");
    await screen.findByText(mockUser.email);
    await screen.findByText("success");
    asserts.assert(true);
  });

  it("with action creator", async () => {
    const { fetchUser, store } = await setupTest();
    const App = () => {
      const query = useApi(fetchUser);
      const user = useSelector((s: any) => {
        const id = createKey(`${fetchUser}`, { id: "1" });
        return selectDataById(s, { id });
      }) as User;

      return h("div", null, [
        h("div", { key: "1" }, user?.email || "no user"),
        h(
          "button",
          { key: "2", onClick: () => query.trigger({ id: "1" }) },
          query.isLoading ? "loading" : "fetch",
        ),
        h("div", { key: "3" }, query.isSuccess ? "success" : ""),
      ]);
    };
    // render(h(Provider, { store, children: h(App) }));

    const button = screen.getByText("fetch");
    fireEvent.click(button);

    await screen.findByText("loading");
    await screen.findByText(mockUser.email);
    await screen.findByText("success");
    asserts.assert(true);
  });
}); */
