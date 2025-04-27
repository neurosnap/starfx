import { describe, expect, it } from "../test.ts";
import {
  createBatchMdw,
  createSchema,
  createStore,
  slice,
} from "../store/mod.ts";
import { parallel } from "../mod.ts";
import { sleep } from "effection";

const batch = describe("batch mdw");

it(batch, "should batch notify subscribers based on mdw", async () => {
  const [schema, initialState] = createSchema({
    cache: slice.table({ empty: {} }),
    loaders: slice.loaders(),
  });
  const store = createStore({
    initialState,
    middleware: [createBatchMdw(queueMicrotask)],
  });
  let counter = 0;
  store.subscribe(() => {
    counter += 1;
  });
  await store.run(function* () {
    const group = yield* parallel([
      () => schema.update(schema.cache.add({ "1": "one" })),
      () => schema.update(schema.cache.add({ "2": "two" })),
      () => schema.update(schema.cache.add({ "3": "three" })),
      () => schema.update(schema.cache.add({ "4": "four" })),
      () => schema.update(schema.cache.add({ "5": "five" })),
      () => schema.update(schema.cache.add({ "6": "six" })),
    ]);
    yield* group;
    // make sure it will still notify subscribers after batched round
    yield* schema.update(schema.cache.add({ "7": "seven" }));
    yield* sleep(0);
  });
  expect(counter).toBe(2);
});
