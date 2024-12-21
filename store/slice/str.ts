import type { AnyState } from "../../types.ts";
import type { BaseSchema } from "../types.ts";

export interface StrOutput<S extends AnyState = AnyState>
  extends BaseSchema<string> {
  schema: "str";
  initialState: string;
  set: (v: string) => (s: S) => void;
  reset: () => (s: S) => void;
  select: (s: S) => string;
}

export function createStr<S extends AnyState = AnyState>({
  name,
  initialState = "",
}: {
  name: keyof S;
  initialState?: string;
}): StrOutput<S> {
  return {
    schema: "str",
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

export function str(initialState?: string) {
  return (name: string) => createStr<AnyState>({ name, initialState });
}
