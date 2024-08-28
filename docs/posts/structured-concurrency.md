---
title: Structured Concurrency
description: What is structured concurrency?
---

Resources:

- [wiki](https://en.wikipedia.org/wiki/Structured_concurrency)
- [await event horizon](https://frontside.com/blog/2023-12-11-await-event-horizon/)
- [Why structured concurrency?](https://bower.sh/why-structured-concurrency)
- [Thinking in Effection](https://frontside.com/effection/docs/thinking-in-effection)
- [Delimited continuation](https://en.wikipedia.org/wiki/Delimited_continuation)
- [Structured Concurrency](https://ericniebler.com/2020/11/08/structured-concurrency/)
- [Structured Concurrency explained](https://www.thedevtavern.com/blog/posts/structured-concurrency-explained/)
- [conc](https://github.com/sourcegraph/conc)

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
