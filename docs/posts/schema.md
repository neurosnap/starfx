---
title: Schema
description: Learn more about schamas and slices
---

- `any`
- `loader`
- `num`
- `obj`
- `str`
- `table`

`createSchema` requires two slices by default in order for it and everything
inside `starfx` to function properly: `cache` and `loader`.

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
