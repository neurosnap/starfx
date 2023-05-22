import { React } from "./deps.ts";
const { createContext, createElement: h, useContext } = React;
import type { Action, Operation, Scope } from "./deps.ts";
import { ActionContext } from "./redux/mod.ts";

export * from "./query/react.ts";

const ScopeContext = createContext<Scope | null>(null);

export function Provider({
  scope,
  children,
}: {
  scope: Scope;
  children: React.ReactNode;
}) {
  return h(ScopeContext.Provider, { value: scope }, children);
}

export function useScope(): Scope {
  const scope = useContext(ScopeContext);
  if (!scope) {
    throw new Error("scope is null");
  }
  return scope;
}

/**
 * This hook dispatches actions directly to the Action channel we use
 * for redux.  This makes it so you don't have to dispatch a redux action
 * in order to trigger an fx.
 */
export function useDispatchFx() {
  const scope = useScope();
  return (action: Action) =>
    scope.run(function* () {
      const { input } = yield* ActionContext;
      yield* input.send(action);
    });
}

export function useFx<T>(op: () => Operation<T>) {
  const scope = useScope();
  return scope.run(op);
}
