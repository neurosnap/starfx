---
title: Caching
description: How to store data in starfx
---

There are two primary ways to store data in `starfx`:

- Manual
- Automatic

# Manual

You have full control over how data is stored in your app, however, the cost is
managing it.

For anything beyond the simplest of apps, actively managing your state is going
to promote a more robust and managable codebase. When you are performing CRUD
operations and want to store those records in a database table that is strongly
typed, you probably want manually managed.

The good news this is really easy in `starfx` because we can leverage
[schemas](/schema) to do most of the heavy lifting.

# Automatic

This one is simpler to setup, easy for it to "just work" and is more like
`react-query`.

When using an endpoint, this method simply stores whatever is put inside
`ctx.json`. Then you can access that data via `useCache`.

```tsx
import { createApi } from "starfx";
import { useCache } from "starfx/react";

const api = createApi();
const fetchUsers = api.get("/users", api.cache());

function App() {
  const { data = [] } = useCache(fetchUsers());
  return <div>{data.map((user) => <div>{user.name}</div>)}</div>;
}
```

`api.cache()` opts into automatic caching. This is really just an alias for:

```ts
function*(ctx, next) {
  ctx.cache = true;
  yield* next();
}
```

The state slice for `cache` is simple, every thunk action has
[special properties](/thunks#anatomy-of-an-action) of which one is a `key` field
that is a hash of the entire user-defined action payload:

```js
{
  [action.payload.key]: {},
}
```

# `timer` supervisor

This supervisor can help us with how often we refetch data. This will help us
call the same endpoint many times but only fetching the data on an interval.

[Read more about it in Supervisors](/supervisors#timer)

This, cominbed with [Automatic caching](#automatic) provides us with the
fundamental features built into `react-query`.
