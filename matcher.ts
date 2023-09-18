import type { AnyAction } from "./types.ts";
import type { Predicate } from "./deps.ts";

type ActionType = string;
type GuardPredicate<G extends T, T = unknown> = (arg: T) => arg is G;
type APredicate = (action: AnyAction) => boolean;
type StringableActionCreator<A extends AnyAction = AnyAction> = {
  (...args: unknown[]): A;
  toString(): string;
};
type SubPattern = APredicate | StringableActionCreator | ActionType;
export type Pattern = SubPattern | SubPattern[];
type ActionSubPattern<Guard extends AnyAction = AnyAction> =
  | GuardPredicate<Guard, AnyAction>
  | StringableActionCreator<Guard>
  | APredicate
  | ActionType;
export type ActionPattern<Guard extends AnyAction = AnyAction> =
  | ActionSubPattern<Guard>
  | ActionSubPattern<Guard>[];

export function matcher(pattern: ActionPattern): Predicate<AnyAction> {
  if (pattern === "*") {
    return function* (input) {
      return !!input;
    };
  }

  if (typeof pattern === "string") {
    return function* (input) {
      return pattern === input.type;
    };
  }

  if (Array.isArray(pattern)) {
    return function* (input) {
      return pattern.some((p) => matcher(p)(input));
    };
  }

  if (typeof pattern === "function" && Object.hasOwn(pattern, "toString")) {
    return function* (input) {
      return pattern.toString() === input.type;
    };
  }

  if (typeof pattern === "function") {
    return function* (input) {
      return pattern(input) as boolean;
    };
  }

  throw new Error("invalid pattern");
}
