---
title: Endpoints
description: endpoints are tasks for managing HTTP requests
---

Building off of `createThunks` we have a way to easily manage http requests.

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
