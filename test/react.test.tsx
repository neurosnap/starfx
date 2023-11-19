import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { createApi, requestMonitor, sleep, createKey } from "starfx";
import { Provider, useSelector, useApi } from "starfx/react";
import { selectDataById, configureStore, createSchema, slice } from "starfx/store";

afterEach(() => { cleanup(); });

const mockUser = { id: '1', email: 'test@saga-query.com' };

const jsonBlob = (data: any) => {
  return Buffer.from(JSON.stringify(data));
};

const setupTest = () => {
  const schema = createSchema({
    user: slice.obj({ empty: { id: "", email: "" } }),
  });

  const api = createApi();
  api.use(requestMonitor());
  api.use(api.routes());
  api.use(function* (ctx, next) {
    yield* sleep(10);
    ctx.json = { ok: true, data: mockUser };
    ctx.response = new Response(jsonBlob(mockUser), { status: 200 });
    yield* next();
  });

  const fetchUser = api.get<{ id: string }>('/user/:id', function* (ctx, next) {
    ctx.cache = true;
    yield* next();
    if (!ctx.json.ok) return;
    schema.db.user.set(ctx.json.data);
  });

  const store = configureStore(schema);
  return { store, fetchUser, api };
};

describe('useApi - with action', async () => {
  const { fetchUser, store } = setupTest();
  const App = () => {
    const action = fetchUser({ id: '1' });
    const query = useApi(action);
    const user = useSelector((s: any) =>
      selectDataById(s, { id: action.payload.key }),
    );

    return <div>
      <div>{user?.email || ""}</div>
      <button onClick={() => query.trigger()}>{query.isLoading ? "loading" : "fetch"}</button>
      <div>{query.isSuccess ? "success" : ""}</div>
    </div>
  };
  render(<Provider store={store}><App /></Provider>);

  const button = screen.getByText('fetch');
  fireEvent.click(button);

  await screen.findByText('loading');
  await screen.findByText(mockUser.email);
  await screen.findByText('success');
});

describe('useApi - with action creator', async () => {
  const { fetchUser, store } = setupTest();
  const App = () => {
    const query = useApi(fetchUser);
    const user = useSelector((s: any) => {
      const id = createKey(`${fetchUser}`, { id: '1' });
      return selectDataById(s, { id });
    });
    return <div>
      <div>{user?.email || "no user"}</div>
      <button>{query.isLoader ? "loading" : "fetch"}</button>
      <div>{query.isSuccess ? "success" : ""}</div>
    </div>
  };
  render(<Provider store={store}><App /></Provider>);

  const button = screen.getByText('fetch');
  fireEvent.click(button);

  await screen.findByText('loading');
  await screen.findByText(mockUser.email);
  await screen.findByText('success');
});
