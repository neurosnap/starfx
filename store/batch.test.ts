import { createBatchMdw } from "./batch.ts";
import { configureStore } from "./store.ts";
import { describe, expect, it } from "../test.ts";
import { createSchema } from "./schema.ts";
import { slice } from "./slice/mod.ts";
import { parallel } from "../fx/mod.ts";

const batch = describe("batch mdw");

it(batch, "should batch notify subscribers based on mdw", async () => {
  const [schema, initialState] = createSchema({
    cache: slice.table({ empty: {} }),
    loaders: slice.loader(),
  });
  const store = configureStore({
    initialState,
    middleware: [createBatchMdw(queueMicrotask)],
  });
  let counter = 0;
  store.subscribe(() => {
    counter += 1;
  });
  await store.run(function* () {
    const group: any = yield* parallel([
      schema.update(schema.cache.add({ "1": "one" })),
      schema.update(schema.cache.add({ "2": "two" })),
      schema.update(schema.cache.add({ "3": "three" })),
      schema.update(schema.cache.add({ "4": "four" })),
      schema.update(schema.cache.add({ "5": "five" })),
      schema.update(schema.cache.add({ "6": "six" })),
    ]);
    yield* group;
    // make sure it will still notify subscribers after batched round
    yield* schema.update(schema.cache.add({ "7": "seven" }));
  });
  expect(counter).toBe(2);
});
