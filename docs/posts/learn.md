---
title: Learn
description: Fundamental concepts in starfx
---

# How does `starfx` work?

`starfx` is a companion framework to `react` that understands how to listen to
user events (e.g. clicks, form inputs, etc.), activate side-effects (e.g. fetch
api data, submit form data, update state), and then intelligently update the
view. If you are familiar with **MVC**:

- `react` is the **View**
- `starfx` is the **Model** and **Controller**

The high-level picture of `starfx` is _essentially_ a glorified pubsub system:

- The user goes to your app
- The view is generated with `react`
- When a user interacts with your web app, events gets dispatched
- `starfx` listens for events and triggers side-effects (e.g. fetches API data,
  updates state, etc.)
- An entirely new version of the `starfx` state gets created
- `react` surgically updates the view based on changes to the `starfx` state
- Rinse and repeat

It all happens as a single unidirectional loop.

# How is `starfx` different?

`starfx` is different in a number of ways.

First, we combine both state and side-effect management into a single cohesive
unit. This streamlines the implementation of your web app.

Second, business logic does not live inside of `react`, rather, it lives inside
of the side-effect system. We are not shackled by `react` lifecycle hooks, in
fact, `starfx` has virtually no concept of `react` at all -- except for a couple
of hooks. Then entire system is designed, from the ground up, to not need
`react` at all in order to function. At the end of the day, `starfx` works by
subscribing to and publishing events. Those events could come from `react`, but
they could also come from anywhere.

Thirdly, we have taken the best part about `express` and `koa` and applied it to
fetching API data on the front-end. What this means is that we have a powerful
middleware system that we can leverage on the front-end.

# Why does `starfx` use js generators?

Generators give us -- the library authors -- more control over how side-effects
are handled within a javascript runtime environment. There are things that we
can do with generators that are just not possible using `async`/`await`. To
provide some specific examples, we need the ability to manage async operations
as a tree of tasks. We need the ability to have
[structured concurrency](https://en.wikipedia.org/wiki/Structured_concurrency)
in order to granularly manipulate, manage, spawn, and teardown tasks.

Furthermore, `async`/`await` is implemented using generator functions. In
`starfx`, not everything we want to `await` is a `Promise`!

There is so much more to why generators are awesome but at the end of the day,
to the end developer, you can treat generators the same as `async`/`await`.

If you are struggling to understand or are getting confused using generator
functions, just use the
[effection async rosetta stone](https://frontside.com/effection/docs/async-rosetta-stone).

We highly recommend reading the
[Thinking in Effection](https://frontside.com/effection/docs/thinking-in-effection)
page because it should help here.
