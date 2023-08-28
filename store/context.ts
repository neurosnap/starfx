import { Channel, createChannel, createContext } from "../deps.ts";
import type { AnyAction, AnyState } from '../types.ts';

import type { FxStore } from "./types.ts";

export const ActionContext = createContext<Channel<AnyAction, void>>(
  "store:action",
  createChannel<AnyAction, void>(),
);

export const StoreUpdateContext = createContext<Channel<void, void>>(
  "store:update",
  createChannel<void, void>(),
);

export const StoreContext = createContext<FxStore<AnyState>>("store");
