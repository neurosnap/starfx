![starfx](https://erock.imgs.sh/starfx)

# starfx

Structured concurrency for your FE apps with a modern approach to side-effect
and state management.

> [!IMPORTANT]\
> This project is under active development, there are zero guarantees for API
> stability.

Read my introductory blog post:
[what is starfx?](https://bower.sh/what-is-starfx)

# features

- async flow control library for `deno`, `node`, and browser
- task tree side-effect management system (like `redux-saga`)
- simple immutable data store (like `redux`)
- traceability throughout the entire system (event logs via dispatching actions)
- data synchronization and caching for `react` (like `react-query`, `rtk-query`)

# design philosophy

- side-effect management is the central processing unit for side-effects, state,
  and the view
- leverage structured concurrency to manage side-effects
- side-effect and state management decoupled from the view layer
- full control over state management
- state is just a side-effect (of user interaction and app features)

# example: thunks are tasks for business logic

Thunks are the foundational central processing units. They have access to all
the actions being dispatched from thew view -- or other thunks. They also wield
the full power of structured concurrency.

Every thunk that is created requires a unique id -- user provided string. This
provides us with a handful of benefits:

- User hand-labels each task created (intention)
- Better tracability (via labels)
- Easier to debug async and side-effects in general (via labels)
- Build abstractions off naming conventions (e.g. creating routers
  `/users [GET]`)

They also come with built-in support for a middleware stack (like `express`).
This provides a familiar and powerful abstraction for async flow control for all
thunks and endpoints.

Each run of a thunk gets its own `ctx` object which provides a substrate to
communicate between middleware.

You didn't know you wanted express middleware for the front-end, but let me get
you excited, it's powerful.

```ts
import { createThunks, mdw } from "starfx";

const thunks = createThunks();
// catch errors from task and logs them with extra info
thunks.use(mdw.err);
// where all the thunks get called in the middleware stack
thunks.use(thunks.routes());

// create a thunk
const log = thunks.create("log", function* (ctx, next) {
  console.log("before calling next middleware");
  yield* next();
  console.log("after all remaining middleware have run");
});

store.dispatch(log());
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

// automatically cache results in datastore
export const fetchUsers = api.get("/users", api.cache());

store.dispatch(fetchUsers());
// now accessible with useCache(fetchUsers)
```

# example: an immutable store that acts like a reactive, in-memory database

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
});

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
        <button onClick={api.trigger()}>fetch users</button>
        {api.isLoading ? <div>Loading ...</div> : null}
      </div>
    </div>
  );
}
```

# usage

Please see [examples repo](https://github.com/neurosnap/starfx-examples).

# when to use this library?

This primary target for this library are single-page apps (SPAs). This is for an
app that might live as a simple web server that serves FE assets and all content
is generated on the user's machine.

Is your app highly interactive, requiring it to persist data across pages? This
is the sweet spot for `starfx`.

You can use this library as general purpose structured concurrency, but
[effection](https://github.com/thefrontside/effection) serves those needs well.

You could use this library for SSR, but I don't heavily build SSR apps, so I
cannot claim it'll work well.

# what is structured concurrency?

This is a board term so I'll make this specific to how `starfx` works.

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
- Supervisor tasks are designed to monitor task health (and automatically
  recover in many cases)

# talk

I recently gave a talk about deliminited continuations where I also discuss this
library:

[![Delminited continuations are all you need](http://img.youtube.com/vi/uRbqLGj_6mI/0.jpg)](https://youtu.be/uRbqLGj_6mI?si=Mok0J8Wp0Z-ahFrN)

# resources

This library is not possible without these foundational libraries:

- [continuation](https://github.com/thefrontside/continuation)
- [effection v3](https://github.com/thefrontside/effection/tree/v3)
