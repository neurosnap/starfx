---
title: Models
description: State management in starfx
---

Once core component of an MVC framework is the Model.

Since data normalization is a first-class citizen inside `starfx`, we built a
custom react database for front-end web apps. Like a backend MVC framework, we
want to think of managing the FE store like managing a database. So while
thinking about models as separate entities, you create all your models by
creating a single schema.

Managing models in `starfx` leverages two primary concepts: schema and store.

The store is a single, global, and reactive object that was built to make
updating views easy. It is essentially an event emitter with a javascript object
attached to it.

Because the goal of this library is to create scalable web apps, we want users
to create all their models at the same time inside of a single schema.
