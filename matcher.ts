import type { AnyAction } from "./types.ts";

type ActionType = string;
type GuardPredicate<G extends T, T = unknown> = (arg: T) => arg is G;
type Predicate<Guard extends AnyAction = AnyAction> = (
  action: Guard,
) => boolean;
type StringableActionCreator<A extends AnyAction = AnyAction> = {
  (...args: unknown[]): A;
  toString(): string;
};
type SubPattern<Guard extends AnyAction = AnyAction> =
  | Predicate<Guard>
  | StringableActionCreator
  | ActionType;
export type Pattern = SubPattern | SubPattern[];
type ActionSubPattern<Guard extends AnyAction = AnyAction> =
  | GuardPredicate<Guard, AnyAction>
  | StringableActionCreator<Guard>
  | Predicate<Guard>
  | ActionType;
export type ActionPattern<Guard extends AnyAction = AnyAction> =
  | ActionSubPattern<Guard>
  | ActionSubPattern<Guard>[];

export function matcher(pattern: ActionPattern): Predicate {
  if (pattern === "*") {
    return (input) => !!input;
  }

  if (typeof pattern === "string") {
    return (input) => pattern === input.type;
  }

  if (Array.isArray(pattern)) {
    return (input) => pattern.some((p) => matcher(p)(input));
  }

  if (typeof pattern === "function" && Object.hasOwn(pattern, "toString")) {
    return (input) => pattern.toString() === input.type;
  }

  if (typeof pattern === "function") {
    return (input) => pattern(input) as boolean;
  }

  throw new Error("invalid pattern");
}
