---
title: Endpoints
description: endpoints are tasks for managing HTTP requests
---

An endpoint is just a specialized thunk designed to manage http requests. It has
a supervisor, it has a middleware stack, and it hijacks the unique id for our
thunks and turns it into a router.

```ts
import { createApi, mdw } from "starfx";

const api = createApi();
// composition of handy middleware for createApi to function
api.use(mdw.api());
api.use(api.routes());
// calls `window.fetch` with `ctx.request` and sets to `ctx.response`
api.use(mdw.fetch({ baseUrl: "https://jsonplaceholder.typicode.com" }));

// automatically cache Response json in datastore as-is
export const fetchUsers = api.get("/users", api.cache());

// create a POST HTTP request
export const updateUser = api.post<{ id: string; name: string }>(
  "/users/:id",
  function* (ctx, next) {
    ctx.request = ctx.req({
      body: JSON.stringify({ name: ctx.payload.name }),
    });
    yield* next();
  },
);

store.dispatch(fetchUsers());
// now accessible with useCache(fetchUsers)

// lets update a user record
store.dispatch(updateUser({ id: "1", name: "bobby" }));
```

# Enforcing fetch response type

When using `createApi` and `mdw.fetch` we can provide the type that we think
will be returned by the fetch response:

```ts
interface Success {
  users: User[];
}

interface Err {
  error: string;
}

const fetchUsers = api.get<never, Success, Err>(
  "/users",
  function* (ctx, next) {
    yield* next();

    if (!ctx.json.ok) {
      // we have an error type
      console.log(ctx.json.value.error);
      return;
    }

    // we have a success type
    console.log(ctx.json.value.users);
  },
);
```

When calling `createApi` you can also pass it a generic error type that all
endpoints inherit:

```ts
import type { ApiCtx } from "starfx";

type MyApiCtx<P = any, S = any> = ApiCtx<P, S, { error: string }>;

const api = createApi<MyApiCtx>();

// this will inherit the types from `MyApiCtx`
const fetchUsers = api.get<never, Success>(
  "/users",
  function* (ctx, next) {
    yield* next();

    if (!ctx.json.ok) {
      // we have an error type
      console.log(ctx.json.value.error);
      return;
    }

    // we have a success type
    console.log(ctx.json.value.users);
  },
);
```

# The same API endpoints but different logic

It is very common to have the same endpoint with different business logic
associated with it.

For example, sometimes I need a simple `fetchUsers` endpoint as well as a
`fetchUsersPoll` endpoint, essentially the same endpoint, but different
supervisor tasks.

Since the router is defined by a thunk id that must be unique, we have to
support a workaround:

```ts
const fetchUsers = api.get("/users");
const fetchUsersPoll = api.get(["/users", "poll"], { supervisors: poll() });
```

The first part of the array is what is used for the router, everything else is
unused. This lets you create as many different variations of calling that
endpoint that you need.
