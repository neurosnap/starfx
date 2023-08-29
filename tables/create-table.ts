import { createSelector } from "../deps.ts";
import type { AnyState, IdProp } from "../types.ts";

interface PropId {
  id: IdProp;
}

interface PropIds {
  ids: IdProp[];
}

interface PatchEntity<T> {
  [key: string]: Partial<T[keyof T]>;
}

const excludesFalse = <T>(n?: T): n is T => Boolean(n);

interface TableSelectors<
  Entity extends AnyState = AnyState,
  S extends AnyState = AnyState,
> {
  findById: (d: Record<IdProp, Entity>, { id }: PropId) => Entity | undefined;
  findByIds: (d: Record<IdProp, Entity>, { ids }: PropIds) => Entity[];
  tableAsList: (d: Record<IdProp, Entity>) => Entity[];
  selectTable: (s: S) => Record<IdProp, Entity>;
  selectTableAsList: (state: S) => Entity[];
  selectById: (s: S, p: PropId) => Entity | undefined;
  selectByIds: (s: S, p: PropIds) => Entity[];
}

function tableSelectors<
  Entity extends AnyState = AnyState,
  S extends AnyState = AnyState,
>(
  selectTable: (s: S) => Record<IdProp, Entity>,
): TableSelectors<Entity, S> {
  const tableAsList = (data: Record<IdProp, Entity>): Entity[] =>
    Object.values(data).filter(excludesFalse);
  const findById = (data: Record<IdProp, Entity>, { id }: PropId) => data[id];
  const findByIds = (
    data: Record<IdProp, Entity>,
    { ids }: PropIds,
  ): Entity[] => ids.map((id) => data[id]).filter(excludesFalse);
  const selectById = (state: S, { id }: PropId): Entity | undefined => {
    const data = selectTable(state);
    return findById(data, { id });
  };
  return {
    findById,
    findByIds,
    tableAsList,
    selectTable,
    selectTableAsList: createSelector(
      selectTable,
      (data): Entity[] => tableAsList(data),
    ),
    selectById,
    selectByIds: createSelector(
      selectTable,
      (_: S, p: PropIds) => p,
      findByIds,
    ),
  };
}

export function mustSelectEntity<Entity extends AnyState = AnyState>(
  defaultEntity: Entity | (() => Entity),
) {
  const isFn = typeof defaultEntity === "function";

  return function selectEntity<S extends AnyState = AnyState>(
    selectById: (s: S, p: PropId) => Entity | undefined,
  ) {
    return (state: S, { id }: PropId): Entity => {
      if (isFn) {
        const entity = defaultEntity as () => Entity;
        return selectById(state, { id }) || entity();
      }

      return selectById(state, { id }) || (defaultEntity as Entity);
    };
  };
}

export const fxCreateTable = <
  Entity extends AnyState = AnyState,
  S extends AnyState = AnyState,
>({
  name,
  initialState = {},
}: {
  name: keyof S;
  initialState?: Record<IdProp, Entity>;
}) => {
  const selectors = tableSelectors<Entity, S>((s: S) => s[name]);

  return {
    name,
    initialState,
    actions: {
      add: (entities: Record<IdProp, Entity>) => (s: S) => {
        const state = selectors.selectTable(s);
        Object.keys(entities).forEach((id) => {
          state[id] = entities[id];
        });
      },
      set: (entities: Record<IdProp, Entity>) => (s: S) => {
        (s as any)[name] = entities;
      },
      remove: (ids: IdProp[]) => (s: S) => {
        const state = selectors.selectTable(s);
        ids.forEach((id) => {
          delete state[id];
        });
      },
      patch: (entities: PatchEntity<Record<IdProp, Entity>>) => (s: S) => {
        const state = selectors.selectTable(s);
        Object.keys(entities).forEach((id) => {
          state[id] = { ...state[id], ...entities[id] };
        });
      },
      merge: (entities: PatchEntity<Record<IdProp, Entity>>) => (s: S) => {
        const state = selectors.selectTable(s);
        Object.keys(entities).forEach((id) => {
          const entity = entities[id];
          Object.keys(entity).forEach((prop) => {
            const val = entity[prop];
            if (Array.isArray(val)) {
              const list = val as any[];
              (state as any)[id][prop].push(...list);
            } else {
              (state as any)[id][prop] = entities[id][prop];
            }
          });
        });
      },
      reset: () => (s: S) => {
        (s as any)[name] = initialState;
      },
    },
    selectors,
  };
};
