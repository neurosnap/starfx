import { api, initialState as schemaInitialState } from "./api";
import { createStore } from "starfx";

export function setupStore({ initialState = {} }) {
  const store = createStore({
    initialState: {
      ...schemaInitialState,
      ...initialState,
    },
  });

  store.run(api.register);

  return store;
}
