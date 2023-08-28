import { createSelector } from "../deps.ts";
import type { AnyState } from "../store/types.ts";
import type { MapEntity, PatchEntity } from "../deps.ts";
export const fxCreateTable = <Entity extends AnyState = AnyState>({
  name,
  initialState,
  selectors = {},
}: {
  name: string;
  initialState: MapEntity<Entity>;
  selectors?: { [key: string]: (state: AnyState, ...args: any[]) => any };
}) => {
  return {
    name,
    initialState: initialState as MapEntity<Entity>,
    actions: {
      add: (value: MapEntity<Entity>) => {
        return { type: `@@starfx/${name}/add`, payload: value };
      },
      set: (value: MapEntity<Entity>) => {
        return { type: `@@starfx/${name}/set`, payload: value };
      },
      remove: (value: string[]) => {
        return { type: `@@starfx/${name}/remove`, payload: value };
      },
      patch: (value: PatchEntity<MapEntity<Entity>>) => {
        return { type: `@@starfx/${name}/patch`, payload: value };
      },
      merge: (value: PatchEntity<MapEntity<Entity>>) => {
        return { type: `@@starfx/${name}/merge`, payload: value };
      },
      reset: () => {
        return { type: `@@starfx/${name}/set`, payload: initialState };
      },
    },
    selectors: {
      selectTable: (state: AnyState) => state[name],
      selectByKey: createSelector(
        [(state: AnyState) => state[name] as MapEntity<Entity>,
        (_, key: keyof MapEntity<Entity>) => key],
        (s, k) => s[k]
      ),
      selectByKeys: createSelector(
        [(state: AnyState) => state[name] as MapEntity<Entity>,
        (_, keys: (keyof MapEntity<Entity>)[]) => keys],
        (s, k) => k.map((key) => s[key])
      ),
      ...selectors,
    },
  };
};

