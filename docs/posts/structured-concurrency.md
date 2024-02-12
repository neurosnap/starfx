---
title: Structured Concurrency
description: What is structured concurrency?
---

This is a broad term so I'll make this specific to how `starfx` works.

Under-the-hood, thunks and endpoints are registered under the root task. Every
thunk and endpoint has their own supervisor that manages them. As a result, what
we have is a single root task for your entire app that is being managed by
supervisor tasks. When the root task receives a signal to shutdown itself (e.g.
`task.halt()` or closing browser tab) it first must shutdown all children tasks
before being resolved.

When a child task throws an exception (whether intentional or otherwise) it will
propagate that error up the task tree until it is caught or reaches the root
task.

In review:

- There is a single root task for an app
- The root task can spawn child tasks
- If root task is halted then all child tasks are halted first
- If a child task is halted or raises exception, it propagates error up the task
  tree
- An exception can be caught (e.g. `try`/`catch`) at any point in the task tree
