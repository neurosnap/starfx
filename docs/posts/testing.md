---
title: Testing
description: You don't need an HTTP interceptor
---

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
