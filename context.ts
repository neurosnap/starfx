import { createContext } from "./deps.ts";

export const ThunkRegistryContext = createContext<{ [key: string]: boolean }>(
  "starfx:thunk:registry",
  {},
);
