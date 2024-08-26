---
title: fx
description: Utilities to handle complex async flow control
---

`fx` (Effects) are helper functions to make async flow control easier.

# parallel

The goal of `parallel` is to make it easier to cooridnate multiple async
operations in parallel, with different ways to receive completed tasks.

All tasks are called with `fx.safe` which means they will never throw an
exception. Instead all tasks will return a Result object that the end
development must evaluate in order to grab the value.

```ts
import { parallel } from "starfx";

function* run() {
  const task = yield* parallel([job1, job2]);
  // wait for all tasks to complete before moving to next yield point
  const results = yield* task;
  // job1 = results[0];
  // job2 = results[1];
}
```

Instead of waiting for all tasks to complete, we can instead loop over tasks as
they arrive:

```ts
function* run() {
  const task = yield* parallel([job1, job2]);
  for (const job of yield* each(task.immediate)) {
    // job2 completes first then it will be first in list
    console.log(job);
    yield* each.next();
  }
}
```

Or we can instead loop over tasks in order of the array provided to parallel:

```ts
function* run() {
  const task = yield* parallel([job1, job2]);
  for (const job of yield* each(task.sequence)) {
    // job1 then job2 will be returned regardless of when the jobs
    // complete
    console.log(job);
    yield* each.next();
  }
}
```
