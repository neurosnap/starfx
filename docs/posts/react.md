---
title: React
description: How to integrate with React
---

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
