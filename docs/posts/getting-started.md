---
title: Getting Started
description: Use starfx with deno, node, or the browser
---

# motivation

We've been sold a lie. You think you need a react framework or server-side
rendering because that's where money is being made. If you are building a highly
dynamic and interactive web application then you probably don't need SSR. These
frameworks sell you that they are an easier way to build web apps, but that's
not true. Just think of it this way: if you can build your web app using only
static assets, isn't that simpler than having static assets and a react
framework server?

React hook-based fetching and caching libraries dramatically simplify data
synchronization but are so tightly coupled to a component's life cycle that it
creates waterfall fetches and loading spinners everywhere. You also have the
downside of not being able to normalize your cache which means you have to spend
time thinking about how and when to invalidate your various caches that hold the
identical API entities.

Further, all of these data caching libraries have sold you another lie. In every
library you are going to see a line similar to this: "Data normalization is hard
and it isn't worth it." Wrong. Their libraries are not built with data
normalization in mind so they claim it's an anti-feature. Why do we want to
normalize data in the backend but not the frontend? Data normalization is
critically important because it makes CRUD operations automatically update your
web app without having to invalidate your cache so the app will refetch the data
you already have.

So what if you are building a highly interactive web app that doesn't need SEO
and you also need more control over data synchronization and caching?

Are you frustrated by the following issues in your react app?

- Prop drilling
- Waterfall fetching data
- Loading spinners everywhere
- Extraneous network calls
- Business logic tightly coupled to react component lifecycle hooks
- State management boilerplate
- Lack of async flow control tooling

We built `starfx` because we looked at the web app landscape and felt like there
was something missing.

Do you want a library that:

- Design for single-page applications (SPAs)
- Has a powerful middleware system similar to express to handle requests and
  responses
- Makes data normalization easy and straightforward
- Reduces state management boilerplate to its absolute essentials
- Has a powerful side-effect management system using structured concurrency
- Has data synchronization and caching separated from react

# when to use this library?

The primary target for this library are single-page apps. This is for an app
that might be hosted inside an object store (like s3) or with a simple web
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
import { createApi, createSchema, createStore, mdw, timer } from "starfx";
import { Provider, useCache } from "starfx/react";

const [schema, initialState] = createSchema();
const store = createStore({ initialState });

const api = createApi();
// mdw = middleware
api.use(mdw.api({ schema }));
api.use(api.routes());
api.use(mdw.fetch({ baseUrl: "https://api.github.com" }));

const fetchRepo = api.get(
  "/repos/neurosnap/starfx",
  { supervisor: timer() },
  api.cache(),
);

store.run(api.bootup);

function App() {
  return (
    <Provider schema={schema} store={store}>
      <Example />
    </Provider>
  );
}

function Example() {
  const { isInitialLoading, isError, message, data } = useCache(fetchRepo());

  if (isInitialLoading) return "Loading ...";

  if (isError) return `An error has occurred: ${message}`;

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
      <strong>👀 {data.subscribers_count}</strong>{" "}
      <strong>✨ {data.stargazers_count}</strong>{" "}
      <strong>🍴 {data.forks_count}</strong>
    </div>
  );
}
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
