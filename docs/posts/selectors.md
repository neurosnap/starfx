---
title: Selectors
description: Deriving data with selectors
---

In a typical web app, the logic for deriving data is usually written as
functions we call selectors.

The basic function signature of a selector:

```ts
const selectData = (state: WebState) => state.data;
```

Selectors are primarily used to encapsulate logic for looking up specific values
from state, logic for actually deriving values, and improving performance by
avoiding unnecessary recalculations.

To learn more, redux has excellent docs
[on deriving data with selectors](https://redux.js.org/usage/deriving-data-selectors).

There is 100% knowledge transfer between selectors in `starfx` and `redux`
because we adhere to the same function signature.

The only difference is that as part of our API we re-export
[reselect.createSelector](https://reselect.js.org/api/createselector/), which
will memoize functions:

```ts
import { createSelector } from "starfx";

const selectData = (state) => state.data;
const myselector = createSelector(
  selectData,
  (data) => data.sort((a, b) => a.id - b.id);
);
```

Function memoization is just a way to cache a function call. If the dependencies
(e.g. the result of `selectData`) don't change, then `myselector` will not be
called: it will return its previous value.
