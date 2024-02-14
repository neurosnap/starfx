---
title: Store
Description: An immutable store that acts like a reactive, in-memory database
---

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
const schema = createSchema({
  cache: slice.table(),
  loaders: slice.loader(),
  users: slice.table<User>(),
});
type WebState = typeof schema.initialState;

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
    yield* schema.update(schema.users.add(users));

    // User[]
    const users = yield* select(schema.users.selectTableAsList);
    // User
    const user = yield* select(
      (state) => schema.users.selectById(state, { id: "1" }),
    );
  },
);

const store = configureStore(schema);
store.run(api.bootup);
store.dispatch(fetchUsers());
```
