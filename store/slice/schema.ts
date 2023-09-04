import { AnyState } from "../../types.ts";

import { createTable } from "./table.ts";
import { createAssign } from "./assign.ts";
// import { StoreUpdater } from "../types.ts";
import { configureStore } from "../store.ts";

/* interface BaseType<TInput, TOutput = TInput> {
  _types: { input: TInput; output: TOutput };
}

interface TableType<TInput, TOutput = TInput>
  extends BaseType<TInput, TOutput> {
}

interface StringType<TOutput = string, S extends AnyState = AnyState> extends BaseType<string, TOutput>, AssignOutput<string, S> {
} */

/* interface SchemaType<S extends AnyState,
  O extends Record<string, SchemaFn<S>> = Record<string, SchemaFn<S>>,
  P extends keyof O = keyof O
  > {
  actions: Record<P, (...args: any[]) => StoreUpdater<S>>;
  selectors?: Record<P, any>;
} */
/* type SchemaFn<
  S extends AnyState,
  O extends Record<string, SchemaFn<S>>,
  P extends keyof O = keyof O
> = (name: string) => { actions: Record<P>}; */

/* function createSchema<
  S extends AnyState = AnyState,
>(obj: Record<string, (name: string) => BaseType<any>>) {
  return Object.keys(obj).reduce((acc, key) => {
    const slice = obj[key];
    (acc as any)[key] = slice(key);
    return acc;
  }, {});
} */

function table<V extends AnyState = AnyState, S extends AnyState = AnyState>(
  name: keyof S,
) {
  return createTable<V, S>({ name });
}

function str<S extends AnyState = AnyState>(name: string, initialState = "") {
  return createAssign<string, S>({ name, initialState });
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

const schema = {
  users: table<User, AppState>("users"),
  token: str<AppState>("token"),
};
const initialState = Object.keys(schema).reduce<
  { [key in keyof AppState]: AppState[key] }
>((acc, key) => {
  (acc as any)[key] = schema[key as keyof AppState].initialState;
  return acc;
}, {} as any);

const store = configureStore({ initialState });
schema.users.actions.add();
schema.users.selectors.selectTable();
