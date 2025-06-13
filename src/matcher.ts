import type { AnyAction } from "./types.js";

type ActionType = string;
type GuardPredicate<G extends T, T = unknown> = (arg: T) => arg is G;
type Predicate<Guard extends AnyAction = AnyAction> = (
  action: Guard,
) => boolean;
type StringableActionCreator<A extends AnyAction = AnyAction> = {
  (...args: any[]): A;
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

function isThunk(fn: any): boolean {
  return (
    typeof fn === "function" &&
    typeof fn.run === "function" &&
    typeof fn.use === "function" &&
    typeof fn.name === "string" &&
    typeof fn.toString === "function"
  );
}

function isActionCreator(fn: any): boolean {
  return !!fn && fn._starfx === true;
}

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

  if (isThunk(pattern)) {
    return (input) => pattern.toString() === input.type;
  }

  if (typeof pattern === "function" && !isActionCreator(pattern)) {
    return (input) => pattern(input) as boolean;
  }

  if (isActionCreator(pattern)) {
    return (input: AnyAction) => pattern.toString() === input.type;
  }

  throw new Error("invalid pattern");
}
