import React from "react";
import { Provider } from "../react.js";
import { createSchema, createStore, slice } from "../store/mod.js";
import { asserts, describe, it } from "../test.js";

const tests = describe("react");

// typing test
it(tests, () => {
  const [schema, initialState] = createSchema({
    cache: slice.table(),
    loaders: slice.loaders(),
  });
  const store = createStore({ initialState });
  React.createElement(Provider, {
    schema,
    store,
    children: React.createElement("div"),
  });
  asserts.equal(true, true);
});
