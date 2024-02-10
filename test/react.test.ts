import { asserts, describe, it, React } from "../test.ts";
import { Provider } from "../react.ts";
import { createSchema, createStore, slice } from "../store/mod.ts";

const tests = describe("react");

// typing test
it(tests, () => {
  const [schema, initialState] = createSchema({
    cache: slice.table(),
    loaders: slice.loader(),
  });
  const store = createStore({ initialState });
  React.createElement(
    Provider,
    { schema, store, children: React.createElement("div") },
  );
  asserts.equal(true, true);
});
