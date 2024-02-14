---
title: Getting Started
description: Use starfx with deno, node, or the browser
---

# design philosophy

- user interaction is a side-effect of using a web app
- side-effect management is the central processing unit to manage user
  interaction, app features, and state
- leverage structured concurrency to manage side-effects
- leverage supervisor tasks to provide powerful design patterns
- side-effect and state management decoupled from the view
- user has full control over state management (opt-in to automatic data
  synchronization)
- state is just a side-effect (of user interaction and app features)

# when to use this library?

The primary target for this library are single-page apps (SPAs). This is for an
app that might be hosted inside an object store (like s3) or with a simple web
server that serves files and that's it.

Is your app highly interactive, requiring it to persist data across pages? This
is the sweet spot for `starfx`.

You can use this library as general purpose structured concurrency, but
[effection](https://github.com/thefrontside/effection) serves those needs well.

You could use this library for SSR, but I don't heavily build SSR apps, so I
cannot claim it'll work well.

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

# the simplest example

Here we demonstrate a complete example so you can get a glimpse of how `starfx`
works. The rest of our docs will go into more detail for how all the pieces
work.

```tsx
import ReactDOM from "react-dom/client";
import { createApi, mdw } from "starfx";
import { configureStore, createSchema, slice } from "starfx/store";
import { Provider, useCache } from "starfx/react";

const api = createApi();
api.use(mdw.api());
api.use(api.routes());
api.use(mdw.fetch({ baseUrl: "https://jsonplaceholder.typicode.com" }));

const fetchUsers = api.get("/users", api.cache());

const schema = createSchema({
  loaders: slice.loader(),
  cache: slice.table(),
});
const store = configureStore(schema);
type WebState = typeof store.initialState;

store.run(api.bootup);

function App() {
  const { isLoading, data: users } = useCache(fetchUsers());

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  return (
    <div>
      {users.map(
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
