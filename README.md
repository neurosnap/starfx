![starfx](https://erock.imgs.sh/starfx)

# starfx

Structured concurrency for your FE apps with a modern approach to side-effect
and state management.

> [!IMPORTANT]\
> This project is under active development, there are zero guarantees for API
> stability.

- [blog posts about starfx](https://bower.sh/?tag=starfx)
- [discord](https://discord.gg/frontside)

# features

- task tree side-effect management system (like `redux-saga`)
- task management and fault-tolerance via supervisors
- simple immutable data store (like `redux`)
- traceability throughout the entire system (event logs via dispatching actions)
- data synchronization and caching for `react` (like `react-query`, `rtk-query`)

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

# example: thunks are tasks for business logic

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

# example: endpoints are tasks for managing HTTP requests

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

# example: an immutable store that acts like a reactive, in-memory database

I love `redux`. I know it gets sniped for having too much boilerplate when
alternatives like `zustand` and `react-query` exist that cut through the
ceremony of managing state. However, `redux` was never designed to be easy to
use, it was designed to be scalable, debuggable, and maintainable. Yes, setting
up a `redux` store is work, but that is in an effort to serve its
maintainability.

Having said that, the core abstraction in `redux` is a reducer. Reducers were
originally designed to contain isolated business logic for updating sections of
state (also known as state slices). They were also designed to make it easier to
sustain state immutability.

Fast forward to `redux-toolkit` and we have `createSlice` which leverages
`immer` under-the-hood to ensure immutability. So we no longer need reducers for
immutability.

Further, I argue, placing the business logic for updating state inside reducers
(via switch-cases) makes understanding business logic harder. Instead of having
a single function that updates X state slices, we have X functions (reducers)
that we need to piece together in our heads to understand what is being updated
when an action is dispatched.

With all of this in mind, `starfx/store` takes all the good parts of `redux` and
removes the need for reducers entirely. We still have a single state object that
contains everything from API data, UX, and a way to create memoized functions
(e.g. selectors). We maintain immutability (using `immer`) and also have a
middleware system to extend it.

Finally, we bring the utility of creating a schema (like `zod` or a traditional
database) to make it plainly obvious what the state shape looks like as well as
reusable utilities to make it easy to update and query state.

This gets us closer to treating our store like a traditional database while
still being flexible for our needs on the FE.

```ts
import { configureStore, createSchema, select, slice } from "starfx/store";

interface User {
  id: string;
  name: string;
}

// app-wide database for ui, api data, or anything that needs reactivity
const { db, initialState, update } = createSchema({
  users: slice.table<User>(),
  cache: slice.table(),
  loaders: slice.loader(),
  // -- more slice examples --
  // token: slice.str(),
  // nav: slice.obj<{ collapsed: boolean }>(),
  // counter: slice.num(0),
  // userIds: slice.any<string[]>(),
});
type AppState = typeof initialState;

// just a normal endpoint
const fetchUsers = api.get<never, User[]>(
  "/users",
  function* (ctx, next) {
    // make the http request
    yield* next();

    // ctx.json is a Result type that either contains the http response
    // json data or an error
    if (!ctx.json.ok) {
      return;
    }

    const { value } = ctx.json;
    const users = value.reduce<Record<string, User>>((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    // update the store and trigger a re-render in react
    yield* update(db.users.add(users));

    // User[]
    const users = yield* select(db.users.selectTableAsList);
    // User
    const user = yield* select(
      (state) => db.users.selectById(state, { id: "1" }),
    );
  },
);

const store = configureStore({ initialState });
store.dispatch(fetchUsers());
```

# example: the view

```tsx
import { useApi, useSelector } from "starfx/react";
import { db } from "./store.ts";
import { fetchUsers } from "./api.ts";

function App() {
  const users = useSelector(db.users.selectTableAsList);
  const api = useApi(fetchUsers());

  return (
    <div>
      {users.map((u) => <div key={u.id}>{u.name}</div>)}
      <div>
        <button onClick={() => api.trigger()}>fetch users</button>
        {api.isLoading ? <div>Loading ...</div> : null}
      </div>
    </div>
  );
}
```

# usage

- [examples repo](https://github.com/neurosnap/starfx-examples)
- [production example repo](https://github.com/aptible/app-ui)

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

# what is structured concurrency?

This is a broad term so I'll make this specific to how `starfx` works.

Under-the-hood, thunks and endpoints are registered under the root task. Every
thunk and endpoint has their own supervisor that manages them. As a result, what
we have is a single root task for your entire app that is being managed by
supervisor tasks. When the root task receives a signal to shutdown itself (e.g.
`task.halt()` or closing browser tab) it first must shutdown all children tasks
before being resolved.

When a child task throws an exception (whether intentional or otherwise) it will
propagate that error up the task tree until it is caught or reaches the root
task.

In review:

- There is a single root task for an app
- The root task can spawn child tasks
- If root task is halted then all child tasks are halted first
- If a child task is halted or raises exception, it propagates error up the task
  tree
- An exception can be caught (e.g. `try`/`catch`) at any point in the task tree

# what is a supervisor task?

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

# example: test that doesn't need an http interceptor

Need to write tests? Use libraries like `msw` or `nock`? Well you don't need
them with `starfx`. If the `mdw.fetch()` middleware detects `ctx.response` is
already filled then it skips making the request. Let's take the update user
endpoint example and provide stubbed data for our tests.

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { useDispatch, useSelector } from "starfx/react";
import { db } from "./schema.ts";
import { updateUser } from "./user.ts";

function UserSettingsPage() {
  const id = "1";
  const dispatch = useDispatch();
  const user = useSelector((state) => db.users.selectById(state, { id }));

  return (
    <div>
      <div>Name: {user.name}</div>
      <button onClick={() => dispatch(updateUser({ id, name: "bobby" }))}>
        Update User
      </button>
    </div>
  );
}

describe("UserSettingsPage", () => {
  it("should update the user", async () => {
    // just for this test -- inject a new middleware into the endpoint stack
    updateUser.use(function* (ctx, next) {
      ctx.response = new Response(
        JSON.stringify({ id: ctx.payload.id, name: ctx.payload.name }),
      );
      yield* next();
    });

    render(<UserSettingsPage />);

    const btn = await screen.findByRole("button", { name: /Update User/ });
    fireEvent.click(btn);

    await screen.findByText(/Name: bobby/);
  });
});
```

That's it. No need for http interceptors and the core functionality works
exactly the same, we just skip making the fetch request for our tests.

What if we don't have an API endpoint yet and want to stub the data? We use the
same concept but inline inside the `updateUser` endpoint:

```ts
export const updateUser = api.post<{ id: string; name: string }>(
  "/users/:id",
  [
    function* (ctx, next) {
      ctx.request = ctx.req({
        body: JSON.stringify({ name: ctx.payload.name }),
      });
      yield* next();
    },
    function* (ctx, next) {
      ctx.response = new Response(
        JSON.stringify({ id: ctx.payload.id, name: ctx.payload.name }),
      );
      yield* next();
    },
  ],
);
```

Wow! Our stubbed data is now colocated next to our actual endpoint we are trying
to mock! Once we have a real API we want to hit, we can just remove that second
middleware function and everything will work exactly the same.

# talk

I recently gave a talk about delimited continuations where I also discuss this
library:

[![Delimited continuations are all you need](http://img.youtube.com/vi/uRbqLGj_6mI/0.jpg)](https://youtu.be/uRbqLGj_6mI?si=Mok0J8Wp0Z-ahFrN)

Here is another talk I helped facilitate about `effection` with the library
creator:

[![effection with Charles Lowell](http://img.youtube.com/vi/lJDgpxRw5WA/0.jpg)](https://youtu.be/lJDgpxRw5WA?si=cCHZiKqNO7vIUhPc)

# resources

This library is not possible without these foundational libraries:

- [continuation](https://github.com/thefrontside/continuation)
- [effection v3](https://github.com/thefrontside/effection/tree/v3)
