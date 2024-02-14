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
