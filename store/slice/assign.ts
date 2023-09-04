import type { AnyState } from "../../types.ts";

export interface AssignOutput<V, S extends AnyState> {
  name: keyof S;
  initialState: V;
  actions: {
    set: (v: V) => (s: S) => void;
    reset: () => (s: S) => void;
  };
}

export function createAssign<V = unknown, S extends AnyState = AnyState>(
  { name, initialState }: { name: keyof S; initialState: V },
): AssignOutput<V, S> {
  return {
    name,
    initialState,
    actions: {
      set: (value) => (state) => {
        (state as any)[name] = value;
      },
      reset: () => (state: S) => {
        (state as any)[name] = initialState;
      },
    },
  };
}
