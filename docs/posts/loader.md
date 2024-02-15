---
title: Loaders
slug: loaders
description: What are loaders?
---

Loaders are general purpose "status trackers." They track the status of a thunk,
an endpoint, or a composite of them. One of the big benefits of decoupled
loaders is you can create as many as you want, and control them however you
want.

[Read my blog article about it](https://bower.sh/on-decoupled-loaders)

# Usage

For endpoints, when you use `storeMdw.store()`, loaders automatically track
fetch requests.

For thunks you can use `storeMdw.loader()` which will track the status of a
thunk.

You can also use loaders manually:

```ts
import { put } from "starfx";
// imaginary schema
import { schema } from "./schema";

function* fn() {
  yield* put(schema.loaders.start({ id: "my-id" }));
  yield* put(schema.loaders.success({ id: "my-id" }));
  yield* put(schema.loaders.error({ id: "my-id", message: "boom!" }));
}
```

# Shape

```ts
export type IdProp = string | number;
export type LoadingStatus = "loading" | "success" | "error" | "idle";
export interface LoaderItemState<
  M extends Record<string, unknown> = Record<IdProp, unknown>,
> {
  id: string;
  status: LoadingStatus;
  message: string;
  lastRun: number;
  lastSuccess: number;
  meta: M;
}

export interface LoaderState<
  M extends AnyState = AnyState,
> extends LoaderItemState<M> {
  isIdle: boolean;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isInitialLoading: boolean;
}
```
