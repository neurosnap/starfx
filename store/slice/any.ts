import type { AnyState } from "../../types.ts";

import type { BaseSchema } from "../types.ts";

export interface AnyOutput<V, S extends AnyState> extends BaseSchema<V> {
  schema: "any";
  initialState: V;
  set: (v: string) => (s: S) => void;
  reset: () => (s: S) => void;
  select: (s: S) => V;
}

export function createAny<V, S extends AnyState = AnyState>(
  { name, initialState }: { name: keyof S; initialState: V },
): AnyOutput<V, S> {
  return {
    schema: "any",
    name: name as string,
    initialState,
    set: (value) => (state) => {
      // deno-lint-ignore no-explicit-any
      (state as any)[name] = value;
    },
    reset: () => (state) => {
      // deno-lint-ignore no-explicit-any
      (state as any)[name] = initialState;
    },
    select: (state) => {
      // deno-lint-ignore no-explicit-any
      return (state as any)[name];
    },
  };
}

export function any<V>(initialState: V) {
  return (name: string) => createAny<V, AnyState>({ name, initialState });
}
