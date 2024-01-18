import { Channel, createChannel, createContext } from "../deps.ts";
import type { AnyState } from "../types.ts";
import type { FxStore } from "./types.ts";

export const StoreUpdateContext = createContext<Channel<void, void>>(
  "store:update",
  createChannel<void, void>(),
);

export const StoreContext = createContext<FxStore<AnyState>>("store");
