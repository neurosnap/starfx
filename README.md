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
import { json, main, parallel, request, each } from "starfx";

function* fetchChapter(title: string) {
  const response = yield* request(`/chapters/${title}`);
  const data = yield* json(response);
  return data;
}

const task = main(function* () {
  const chapters = ["01", "02", "03"];
  const ops = chapters.map((title) => () => fetchChapter(title));

  // parallel returns a list of `Result` type
  const chapters = yield* parallel(ops);

  // make http requests in parallel but process them in sequence (e.g. 01, 02,
  03)
  for (const result of yield* each(chapters.sequence)) {
    if (result.ok) {
      console.log(result.value);
    } else {
      console.error(result.error);
    }
    yield* each.next;
  }
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
