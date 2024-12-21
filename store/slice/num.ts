import type { AnyState } from "../../types.ts";
import type { BaseSchema } from "../types.ts";

export interface NumOutput<S extends AnyState> extends BaseSchema<number> {
  schema: "num";
  initialState: number;
  set: (v: number) => (s: S) => void;
  increment: (by?: number) => (s: S) => void;
  decrement: (by?: number) => (s: S) => void;
  reset: () => (s: S) => void;
  select: (s: S) => number;
}

export function createNum<S extends AnyState = AnyState>({
  name,
  initialState = 0,
}: {
  name: keyof S;
  initialState?: number;
}): NumOutput<S> {
  return {
    name: name as string,
    schema: "num",
    initialState,
    set: (value) => (state) => {
      // deno-lint-ignore no-explicit-any
      (state as any)[name] = value;
    },
    increment:
      (by = 1) =>
      (state) => {
        // deno-lint-ignore no-explicit-any
        (state as any)[name] += by;
      },
    decrement:
      (by = 1) =>
      (state) => {
        // deno-lint-ignore no-explicit-any
        (state as any)[name] -= by;
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

export function num(initialState?: number) {
  return (name: string) => createNum<AnyState>({ name, initialState });
}
