import { Channel, createChannel, createContext, Signal } from "../deps.ts";
import type { AnyAction, AnyState } from "../types.ts";

import type { FxStore } from "./types.ts";

export const ActionContext = createContext<Signal<AnyAction, void>>(
  "store:action",
);

export const StoreUpdateContext = createContext<Channel<void, void>>(
  "store:update",
  createChannel<void, void>(),
);

export const StoreContext = createContext<FxStore<AnyState>>("store");
