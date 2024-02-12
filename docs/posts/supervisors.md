---
title: Supervisors
description: Learn how supervisor tasks work
---

[Supplemental reading from erlang](https://www.erlang.org/doc/design_principles/des_princ)

A supervisor task is a way to monitor children tasks and probably most
importantly, manage their health. By structuring your side-effects and business
logic around supervisor tasks, we gain very interesting coding paradigms that
result is easier to read and manage code.

The most basic version of a supervisor is simply an infinite loop that calls a
child task:

```ts
function* supervisor() {
  while (true) {
    try {
      yield* call(someTask);
    } catch (err) {
      console.error(err);
    }
  }
}
```

Here we call some task that should always be in a running and healthy state. If
it raises an exception, we log it and try to run the task again.

Building on top of that simple supervisor, we can have tasks that always listen
for events and if they fail, restart them.

```ts
import { parallel, run, takeEvery } from "starfx";

function* watchFetch() {
  yield* takeEvery("FETCH_USERS", function* (action) {
    console.log(action);
  });
}

function* send() {
  yield* put({ type: "FETCH_USERS" });
  yield* put({ type: "FETCH_USERS" });
  yield* put({ type: "FETCH_USERS" });
}

await run(
  parallel([watchFetch, send]),
);
```

Here we create a supervisor function using a helper `takeEvery` to call a
function for every `FETCH_USERS` event emitted.

However, this means that we are going to make the same request 3 times, we
probably want a throttle or debounce to prevent this behavior.

```ts
import { takeLeading } from "starfx";

function* watchFetch() {
  yield* takeLeading("FETCH_USERS", function* (action) {
    console.log(action);
  });
}
```

That's better, now only one task can be alive at one time.

Both thunks and endpoints simply listen for particular actions being emitted
onto the `ActionContext` -- which is just an event emitter -- and then call the
middleware stack with that action.

Both thunks and endpoints support overriding the default `takeEvery` supervisor
for either our officially supported supervisors `takeLatest` and `takeLeading`,
or a user-defined supervisor.

Because every thunk and endpoint have their own supervisor tasks monitoring the
health of their children, we allow the end-developer to change the default
supervisor -- which is `takeEvery`:

```ts
const someAction = thunks.create("some-action", { supervisor: takeLatest });
dispatch(someAction()); // this task gets cancelled
dispatch(someAction()); // this task gets cancelled
dispatch(someAction()); // this tasks lives
```

This is the power of supervisors and is fundamental to how `starfx` works.
