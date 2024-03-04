---
title: Middleware
slug: middleware
description: The structure of a middleware function
---

Here is the most basic middleware (mdw) function in `starfx`:

```ts
function* (ctx, next) {
  yield* next();
}
```

Thunks and endpoints are just thin wrappers around a mdw stack:

For example, the recommended mdw stack for `createApi()` looks like this:

```ts
import { createApi, mdw } from "starfx";
import { schema } from "./schema";

// this api:
const api = createApi();
api.use(mdw.api({ schema }));
api.use(api.routes());
api.use(mdw.fetch({ baseUrl: "https://api.com" }));

// looks like this:
[
  mdw.err,
  mdw.queryCtx,
  mdw.customKey,
  mdw.nameParser,
  mdw.actions,
  mdw.loaderApi({ schema }),
  mdw.cache({ schema }),
  api.routes(),
  mdw.composeUrl("https://api.com"),
  mdw.payload,
  mdw.request,
  mdw.json,
];
```

When a mdw function calls `yield* next()`, all it does it call the next mdw in
the stack. When that yield point resolves, it means all the mdw functions after
it have been called. This doesn't necessarily mean all mdw in the stack will be
called, because like `koa`, you can return early inside a mdw function,
essentially cancelling all subsequent mdw.

# Context

The context object is just a plain javascript object that gets passed to every
mdw. The type of `ctx` depends ... on the context. But for thunks, we have this
basic structure:

```ts
interface Payload<P> {
  payload: P;
}

interface ThunkCtx<P = any> extends Payload<P> {
  name: string;
  key: string;
  action: ActionWithPayload<CreateActionPayload<P>>;
  actionFn: IfAny<
    P,
    CreateAction<ThunkCtx>,
    CreateActionWithPayload<ThunkCtx<P>, P>
  >;
  result: Result<void>;
}
```

There are **three** very important properties that you should know about:

- `name` - the name you provided when creating the thunk
- `payload` - the arbitrary data you passed into the thunk
- `key` - a hash of `name` and `payload`
