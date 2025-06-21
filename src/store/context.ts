import { type Channel, createChannel, createContext } from "effection";
import type { AnyState } from "../types.js";
import type { FxStore } from "./types.js";

export const StoreUpdateContext = createContext<Channel<void, void>>(
  "starfx:store:update",
  createChannel<void, void>(),
);
export const StoreContext = createContext<FxStore<AnyState>>("starfx:store");
export const ThunksContext = createContext<string[]>(
  "starfx:thunks",
  [] as string[],
);
