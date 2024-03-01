---
title: Getting Started
description: Use starfx with deno, node, or the browser
---

# motivation

Are you frustrated by the following issues in your react app?

- Prop drilling
- Waterfall fetching data
- Loading spinners everywhere
- Extraneous network calls
- Business logic tightly coupled to react component lifecycle hooks
- State management boilerplate
- Lack of data normalization
- Lack of async flow control tooling

`starfx` will help with all of these common problems with modern react web apps.

# when to use this library?

The primary target for this library are single-page apps (SPAs). This is for an
app that might be hosted inside an object store (like s3) or with a simple web
server that serves files and that's it.

Is your app highly interactive, requiring it to persist data across pages? This
is the sweet spot for `starfx`.

# code

Here we demonstrate a complete example so you can glimpse at how `starfx` works.
In this example, we will fetch users from an API endpoint, cache the `Response`
json, and then ensure the endpoint only gets called at-most once every **5
minutes**, mimicking the basic features of `react-query`.

[Codesanbox](https://codesandbox.io/p/sandbox/starfx-simplest-dgqc9v?file=%2Fsrc%2Findex.tsx)

```tsx
import ReactDOM from "react-dom/client";
import { createApi, mdw, timer } from "starfx";
import { configureStore, createSchema, slice, storeMdw } from "starfx/store";
import { Provider, useCache } from "starfx/react";

const [schema, initialState] = createSchema({
  loaders: slice.loaders(),
  cache: slice.table(),
});

const api = createApi();
api.use(mdw.api());
api.use(storeMdw.store(schema));
api.use(api.routes());
api.use(mdw.fetch({ baseUrl: "https://jsonplaceholder.typicode.com" }));

const fetchUsers = api.get(
  "/users",
  { supervisor: timer() },
  api.cache(),
);

const store = configureStore(initialState);
type WebState = typeof initialState;

store.run(api.bootup);

function App() {
  const { isLoading, data: users } = useCache(fetchUsers());

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  return (
    <div>
      {users?.map(
        (user) => <div key={user.id}>{user.name}</div>,
      )}
    </div>
  );
}

const root = document.getElementById("root") as HTMLElement;
ReactDOM.createRoot(root).render(
  <Provider schema={schema} store={store}>
    <App />
  </Provider>,
);
```

# install

```bash
npm install starfx
```

```bash
yarn add starfx
```

```ts
import * as starfx from "https://deno.land/x/starfx@0.7.0/mod.ts";
```
