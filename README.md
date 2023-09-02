![starfx](https://erock.imgs.sh/starfx)

# starfx

Supercharged async flow control library.

> This project is under active development, there are zero guarantees for API
> stability.

## features

- async flow control library for `deno`, `node`, and browser
- task tree side-effect management system (like `redux-saga`)
- simple immutable data store (like `redux`)
- traceability throughout the entire system (dispatch actions)
- data synchronization and caching for `react` (like `react-query`,
  `redux/toolkit`)

## talk

I recently gave a talk about deliminited continuations where I also discuss this
library:

[![Delminited continuations are all you need](http://img.youtube.com/vi/uRbqLGj_6mI/0.jpg)](https://youtu.be/uRbqLGj_6mI?si=Mok0J8Wp0Z-ahFrN)

## example

This complete solution to the problem Jake Archibald discusses in his blog
article
[The gotcha of unhandled promise rejections](https://jakearchibald.com/2023/unhandled-rejections/):

```ts
import { json, main, parallel, request } from "starfx";

function* fetchMovie(title: string) {
  const response = yield* request(`/movies/${title}`);
  const data = yield* json(response);
  return data;
}

const task = main(function* () {
  const movies = ["titanic", "avatar", "good will hunting"];
  const ops = movies.map((title) => () => fetchMovie(title));

  // parallel returns a list of `Result` type
  const group = yield* parallel(ops);
  // wait for results
  const results = yield* group;
  return results;
});

const results = await task;
console.log(results);
```

## usage

Please see [examples repo](https://github.com/neurosnap/starfx-examples).

## resources

This library is not possible without these foundational libraries:

- [continuation](https://github.com/thefrontside/continuation)
- [effection v3](https://github.com/thefrontside/effection/tree/v3)
