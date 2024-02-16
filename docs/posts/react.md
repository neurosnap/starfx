---
title: React
description: How to integrate with React
---

Even though we are **not** using `redux`, if you are familiar with
[react-redux](https://react-redux.js.org) then this will be an identical
experience because that's what we are using under-the-hood to integrate with
`react`.

`useDispatch`, `useSelector`, and `createSelector` are the bread and butter of
`redux`'s integration with `react` all of which we use inside `starfx`.

```tsx
import {
  TypedUseSelectorHook,
  useApi,
  useSelector as useBaseSelector,
} from "starfx/react";
import { schema, WebState } from "./store.ts";
import { fetchUsers } from "./api.ts";

const useSelector: TypedUseSelectorHook<WebState> = useBaseSelector;

function App() {
  const users = useSelector(schema.users.selectTableAsList);
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

# hooks

## `useSelector`

[See `react-redux` docs](https://react-redux.js.org/api/hooks#useselector)

## `useDispatch`

[See `react-redux` docs](https://react-redux.js.org/api/hooks#usedispatch)

## `useLoader`

Will accept an action creator or action and return the loader associated with
it.

```tsx
import { useLoader } from "starfx/react";

const log = thunks.create<string>("log");

function App() {
  // this will grab loader for any `log` thunks dispatched
  // `action.payload.name`
  const loaderAny = useLoader(log);
  // this will grab loader a specific `log` thunk dispatched
  // `action.payload.key`
  const loader = useLoader(log("specific thunk"));
}
```

## `useApi`

Will take an action creator or action itself and fetch the associated loader and
create a `trigger` function that you can call later in your react component.

This hook will _not_ fetch the data for you because it does not know how to
fetch data from your redux state.

```ts
import { useApi } from 'starfx/react';

import { api } from './api';

const fetchUsers = api.get('/users', function*() {
  // ...
});

const View = () => {
  const { isLoading, trigger } = useApi(fetchUsers);
  useEffect(() => {
    trigger();
  }, []);
  return <div>{isLoading ? : 'Loading' : 'Done!'}</div>
}
```

## `useQuery`

Uses [useApi](#useapi) and automatically calls `useApi().trigger()`

```ts
import { useQuery } from 'starfx/react';

import { api } from './api';

const fetchUsers = api.get('/users', function*() {
  // ...
});

const View = () => {
  const { isLoading } = useQuery(fetchUsers);
  return <div>{isLoading ? : 'Loading' : 'Done!'}</div>
}
```

## `useCache`

Uses [useQuery](#usequery) and automatically selects the cached data associated
with the action creator or action provided.

```ts
import { useCache } from 'starfx/react';

import { api } from './api';

const fetchUsers = api.get('/users', api.cache());

const View = () => {
  const { isLoading, data } = useCache(fetchUsers());
  return <div>{isLoading ? : 'Loading' : data.length}</div>
}
```

## `useLoaderSuccess`

Will activate the callback provided when the loader transitions from some state
to success.

```ts
import { useApi, useLoaderSuccess } from "starfx/react";

import { api } from "./api";

const createUser = api.post("/users", function* (ctx, next) {
  // ...
});

const View = () => {
  const { loader, trigger } = useApi(createUser);
  const onSubmit = () => {
    trigger({ name: "bob" });
  };

  useLoaderSuccess(loader, () => {
    // success!
    // Use this callback to navigate to another view
  });

  return <button onClick={onSubmit}>Create user!</button>;
};
```
