import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "starfx/react";
import { schema } from "../src/api";
import { setupStore } from "../src/store";

const AllTheProviders = ({ children }) => {
  const store = setupStore({});
  return (
    <Provider schema={schema} store={store}>
      {children}
    </Provider>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
