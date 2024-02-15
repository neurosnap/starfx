---
title: Schema
description: Learn more about schamas and slices
---

A schema has two primary features:

- A fully typed state shape
- Reusable pieces of state management logic

A schema must be an object. It is composed of slices of state. Slices can
represent any data type, however, we recommend keeping it as JSON serializable
as possible. Slices not only hold a value, but associated with that value are
ways to:

- Update the value
- Query for data within the value

# Built-in slices

As a result, the following slices should cover the most common data types and
associated logic:

- `any`
- `loader`
- `num`
- `obj`
- `str`
- `table`

# Schema assumptions

`createSchema` requires two slices by default in order for it and everything
inside `starfx` to function properly: `cache` and `loader`.

Why do we require those slices? Because if we can assume those exist, we can
build a lot of useful middleware and supervisors on top of that assumption. It's
a place for `starfx` and third-party functionality to hold their state.

# Build your own slice

We will build a `counter` slice to demonstrate how to build your own slices.

```ts
import type { AnyState } from "starfx";
import { BaseSchema, select } from "starfx/store";

export interface CounterOutput<S extends AnyState> extends BaseSchema<number> {
  schema: "counter";
  initialState: number;
  increment: (by?: number) => (s: S) => void;
  decrement: (by?: number) => (s: S) => void;
  reset: () => (s: S) => void;
  select: (s: S) => number;
}

export function createCounter<S extends AnyState = AnyState>(
  { name, initialState = 0 }: { name: keyof S; initialState?: number },
): CounterOutput<S> {
  return {
    name: name as string,
    schema: "counter",
    initialState,
    increment: (by = 1) => (state) => {
      (state as any)[name] += by;
    },
    decrement: (by = 1) => (state) => {
      (state as any)[name] -= by;
    },
    reset: () => (state) => {
      (state as any)[name] = initialState;
    },
    select: (state) => {
      return (state as any)[name];
    },
  };
}

export function counter(initialState?: number) {
  return (name: string) => createCounter<AnyState>({ name, initialState });
}

const schema = createSchema({
  counter: counter(100),
});
const store = configureStore(schema);

store.run(function* () {
  yield* schema.update([
    schema.counter.increment(),
    schema.counter.increment(),
  ]);
  const result = yield* select(schema.counter.select);
  console.log(result); // 102
});
```
