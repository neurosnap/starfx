export {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "jsr:@std/testing/bdd";
export * as assertType from "jsr:@std/testing/types";
export { assert } from "jsr:@std/assert";
export * as asserts from "jsr:@std/assert";
export { expect } from "jsr:@std/expect";
export { install, mock } from "https://deno.land/x/mock_fetch@0.3.0/mod.ts";

export function isLikeSelector(selector: unknown) {
  return (
    selector !== null &&
    typeof selector === "object" &&
    Reflect.getPrototypeOf(selector) === Object.prototype &&
    Reflect.ownKeys(selector).length > 0
  );
}

export const CIRCULAR_SELECTOR = new Error("Encountered a circular selector");

export function assertLike(
  lhs: Record<any, any>,
  selector: Record<any, any>,
  circular = new Set(),
) {
  if (circular.has(selector)) {
    throw CIRCULAR_SELECTOR;
  }

  circular.add(selector);

  if (lhs === null || typeof lhs !== "object") {
    return lhs;
  }

  const comparable: Record<any, any> = {};
  for (const [key, rhs] of Object.entries(selector)) {
    if (isLikeSelector(rhs)) {
      comparable[key] = assertLike(Reflect.get(lhs, key), rhs, circular);
    } else {
      comparable[key] = Reflect.get(lhs, key);
    }
  }

  return comparable;
}
