import { createApi, createSchema, mdw, slice } from "starfx";

interface User {
  id: string;
  name: string;
}

const emptyUser: User = { id: "", name: "" };
export const [schema, initialState] = createSchema({
  users: slice.table({ empty: emptyUser }),
  cache: slice.table(),
  loaders: slice.loaders(),
});
export type AppState = typeof initialState;

export const api = createApi();
api.use(mdw.api({ schema }));
api.use(api.routes());
api.use(mdw.fetch({ baseUrl: "https://jsonplaceholder.typicode.com" }));

export const fetchUsers = api.get<never, User[]>(
  "/users",
  function* (ctx, next) {
    yield* next();

    if (!ctx.json.ok) {
      return;
    }

    const users = ctx.json.value.reduce<Record<string, User>>((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    yield* schema.update(schema.users.add(users));
  },
);
