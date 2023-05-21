import type { Action } from "../deps.ts";

type ActionType = string;
type GuardPredicate<G extends T, T = unknown> = (arg: T) => arg is G;
type Predicate = (action: Action) => boolean;
type StringableActionCreator<A extends Action = Action> = {
  (...args: unknown[]): A;
  toString(): string;
};
type SubPattern = Predicate | StringableActionCreator | ActionType;
export type Pattern = SubPattern | SubPattern[];
type ActionSubPattern<Guard extends Action = Action> =
  | GuardPredicate<Guard, Action>
  | StringableActionCreator<Guard>
  | Predicate
  | ActionType;
export type ActionPattern<Guard extends Action = Action> =
  | ActionSubPattern<Guard>
  | ActionSubPattern<Guard>[];

export function matcher(pattern: ActionPattern): (input: Action) => boolean {
  if (pattern === "*") {
    return (input: Action) => !!input;
  }

  if (typeof pattern === "string") {
    return (input: Action) => pattern === input.type;
  }

  if (Array.isArray(pattern)) {
    return (input: Action) => pattern.some((p) => matcher(p)(input));
  }

  if (typeof pattern === "function" && Object.hasOwn(pattern, "toString")) {
    return (input: Action) => pattern.toString() === input.type;
  }

  if (typeof pattern === "function") {
    return (input: Action) => pattern(input) as boolean;
  }

  throw new Error("invalid pattern");
}
