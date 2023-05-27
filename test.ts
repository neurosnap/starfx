export { build, emptyDir } from "https://deno.land/x/dnt@0.36.0/mod.ts";
export { assert } from "https://deno.land/std@0.187.0/testing/asserts.ts";
export {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.163.0/testing/bdd.ts";
export * as asserts from "https://deno.land/std@0.185.0/testing/asserts.ts";
export { expect } from "https://deno.land/x/expect@v0.3.0/mod.ts";
export {
  install,
  mock,
  mockedFetch,
} from "https://deno.land/x/mock_fetch@0.3.0/mod.ts";

import { contextualize } from "./context.ts";
import { configureStore, createScope } from "./deps.ts";

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

export function setupReduxScope() {
  const scope = createScope();
  const store = configureStore({
    reducer: () => null,
  });
  scope.run(function* () {
    yield* contextualize("redux:store", store);
  });
  return scope;
}
