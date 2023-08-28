import { configureStore, Tuple } from "../deps.ts";
import { prepareStore } from "./middleware.ts";

export const createStore = () => {
  const { reducer, fx } = prepareStore({
    reducers: {
      def: (s = null, _) => s,
    },
  });
  const store = configureStore({
    reducer,
    middleware: new Tuple(fx.middleware as any),
    preloadedState: {},
  });
  return { store, fx };
};
