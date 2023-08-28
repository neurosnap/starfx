import type { AnyAction } from "./types.ts";

type ActionType = string;
type GuardPredicate<G extends T, T = unknown> = (arg: T) => arg is G;
type Predicate = (action: AnyAction) => boolean;
type StringableActionCreator<A extends AnyAction = AnyAction> = {
  (...args: unknown[]): A;
  toString(): string;
};
type SubPattern = Predicate | StringableActionCreator | ActionType;
export type Pattern = SubPattern | SubPattern[];
type ActionSubPattern<Guard extends AnyAction = AnyAction> =
  | GuardPredicate<Guard, AnyAction>
  | StringableActionCreator<Guard>
  | Predicate
  | ActionType;
export type ActionPattern<Guard extends AnyAction = AnyAction> =
  | ActionSubPattern<Guard>
  | ActionSubPattern<Guard>[];

export function matcher(pattern: ActionPattern): (input: AnyAction) => boolean {
  if (pattern === "*") {
    return (input: AnyAction) => !!input;
  }

  if (typeof pattern === "string") {
    return (input: AnyAction) => pattern === input.type;
  }

  if (Array.isArray(pattern)) {
    return (input: AnyAction) => pattern.some((p) => matcher(p)(input));
  }

  if (typeof pattern === "function" && Object.hasOwn(pattern, "toString")) {
    return (input: AnyAction) => pattern.toString() === input.type;
  }

  if (typeof pattern === "function") {
    return (input: AnyAction) => pattern(input) as boolean;
  }

  throw new Error("invalid pattern");
}
