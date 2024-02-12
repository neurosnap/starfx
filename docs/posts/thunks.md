---
title: Thunks
description: Thunks are tasks for business logic
---

Thunks are the foundational central processing units. They have access to all
the actions being dispatched from the view as well as your global state. They
also wield the full power of structured concurrency.

As I've been developing these specialized thunks, I'm starting to think of them
more like micro-controllers. Only thunks and endpoints have the ability to
update state. However, thunks are not tied to any particular view and in that
way are more composable. Thunks can call other thunks and you have the async
flow control tools from effection to facilitate coordination.

Every thunk that is created requires a unique id -- user provided string. This
provides us with a handful of benefits:

- User hand-labels each thunk created
- Better traceability (via labels)
- Easier to debug async and side-effects in general (via labels)
- Build abstractions off naming conventions (e.g. creating routers
  `/users [GET]`)

They also come with built-in support for a middleware stack (like `express`).
This provides a familiar and powerful abstraction for async flow control for all
thunks and endpoints.

Each run of a thunk gets its own `ctx` object which provides a substrate to
communicate between middleware.

```ts
import { call, createThunks, mdw } from "starfx";

const thunks = createThunks();
// catch errors from task and logs them with extra info
thunks.use(mdw.err);
// where all the thunks get called in the middleware stack
thunks.use(thunks.routes());
thunks.use(function* (ctx, next) {
  console.log("last mdw in the stack");
  yield* next();
});

// create a thunk
const log = thunks.create<string>("log", function* (ctx, next) {
  const resp = yield* call(
    fetch("https://log-drain.com", {
      method: "POST",
      body: JSON.stringify({ message: ctx.payload }),
    }),
  );
  console.log("before calling next middleware");
  yield* next();
  console.log("after all remaining middleware have run");
});

store.dispatch(log("sending log message"));
// output:
// before calling next middleware
// last mdw in the stack
// after all remaining middleware have run
```
