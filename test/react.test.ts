import { asserts, describe, it } from "../test.ts";
import { Provider } from "../react.ts";
import { createSchema, createStore, slice } from "../store/mod.ts";
import { React } from "../deps.ts";

const tests = describe("react");

// typing test
it(tests, () => {
  const [schema, initialState] = createSchema({
    cache: slice.table(),
    loaders: slice.loaders(),
  });
  const store = createStore({ initialState });
  React.createElement(
    Provider,
    { schema, store, children: React.createElement("div") },
  );
  asserts.equal(true, true);
});
