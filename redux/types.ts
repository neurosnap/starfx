import type { AnyAction } from "../types.ts";

export interface StoreLike<S = unknown> {
  getState: () => S;
  dispatch: (action: AnyAction) => void;
}
