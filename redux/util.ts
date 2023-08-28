import { createStore, applyMiddleware } from "../deps.ts";
import { prepareStore } from "./middleware.ts";

export const createTestStore = () => {
  const { reducer, fx } = prepareStore({
    reducers: {
      def: (s = null, _) => s,
    },
  });
  const store = createStore(reducer, {}, applyMiddleware(fx.middleware as any));
  return { store, fx };
};
