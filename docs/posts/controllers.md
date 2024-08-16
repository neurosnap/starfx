---
title: Controllers
description: How controllers work in starfx
---

Why do we call this a micro-mvc framework? Well, our controllers are lighter
weight than traditional MVC frameworks.

Controllers do not relate to pages, they most often relate to centralized pieces
of business logic. This could be as simple as making a single API endpoint and
caching the results or as complex as making multiple dependent API calls and
combinatory logic.

Not only do have a centralized place for handling complex business logic,
fetching API data, and updating our FE global state, but we also have a robust
middleware system similar to `express` or `koa`!

In the following sections we will discuss how to create controllers and the
different use cases for them inside `starfx`.
