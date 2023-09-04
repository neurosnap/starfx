import { AnyState } from "../../types.ts";

import { createTable } from "./table.ts";
import { createAssign } from "./assign.ts";
import { StoreUpdater } from "../types.ts";
import { configureStore } from "../store.ts";

interface BaseType<TInput, TOutput> {
  _types: { input: TInput; output: TOutput };
}

/* interface SchemaType<S extends AnyState,
  O extends Record<string, SchemaFn<S>> = Record<string, SchemaFn<S>>,
  P extends keyof O = keyof O
  > {
  actions: Record<P, (...args: any[]) => StoreUpdater<S>>;
  selectors?: Record<P, any>;
} */
type SchemaFn<
  S extends AnyState,
  O extends Record<string, SchemaFn<S>>,
  P extends keyof O = keyof O,
> = (name: string) => { actions: Record<P> };

function createSchema<
  S extends AnyState = AnyState,
  O extends Record<string, SchemaFn<S>> = Record<string, SchemaFn<S>>,
  P extends keyof O = keyof O,
>(obj: O) {
  const fin: Record<string, ReturnType<O[P]>> = {};
  Object.keys(obj).forEach((key) => {
    const slice = obj[key];
    fin[key] = slice(key);
  });
  return fin as Record<P, ReturnType<O[P]>> & { initialState: S };
}

function table<V extends AnyState = AnyState, S extends AnyState = AnyState>() {
  return (name: string) => createTable<V, S>({ name });
}

function str() {
  return (name: string, initialState = "") =>
    createAssign({ name, initialState });
}

function createStore<S extends AnyState = AnyState>(sch: { initialState: S }) {
  return configureStore<S>({ initialState: sch.initialState });
}

// trying something

interface User {
  id: string;
  name: string;
}

interface AppState {
  users: Record<string, User>;
  token: string;
}

const users = table<User>();
const schema = createSchema<AppState>({
  users,
  token: str(),
});

const store = createStore(schema);
schema.users.actions.add();
schema.users.selectors.selectTable();
