import { createSelector } from "../../deps.ts";
import type { AnyState, IdProp } from "../../types.ts";
import { BaseSchema } from "../types.ts";

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

function mustSelectEntity<Entity extends AnyState = AnyState>(
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

interface TableSelectorsMust<
  Entity extends AnyState = AnyState,
  S extends AnyState = AnyState,
> extends TableSelectors<Entity, S> {
  findById: (d: Record<IdProp, Entity>, { id }: PropId) => Entity;
  selectById: (s: S, p: PropId) => Entity;
}

function tableSelectors<
  Entity extends AnyState = AnyState,
  S extends AnyState = AnyState,
>(
  selectTable: (s: S) => Record<IdProp, Entity>,
  empty: Entity | (() => Entity),
): TableSelectorsMust<Entity, S>;
function tableSelectors<
  Entity extends AnyState = AnyState,
  S extends AnyState = AnyState,
>(
  selectTable: (s: S) => Record<IdProp, Entity>,
  empty?: Entity | (() => Entity),
): TableSelectors<Entity, S>;
function tableSelectors<
  Entity extends AnyState = AnyState,
  S extends AnyState = AnyState,
>(
  selectTable: (s: S) => Record<IdProp, Entity>,
  empty: Entity | (() => Entity) | undefined,
): TableSelectors<Entity, S> {
  const must = empty ? mustSelectEntity(empty) : null;
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
    findById: must ? must(findById) : findById,
    findByIds,
    tableAsList,
    selectTable,
    selectTableAsList: createSelector(
      selectTable,
      (data): Entity[] => tableAsList(data),
    ),
    selectById: must ? must(selectById) : selectById,
    selectByIds: createSelector(
      selectTable,
      (_: S, p: PropIds) => p,
      findByIds,
    ),
  };
}

export interface TableOutput<Entity extends AnyState, S extends AnyState>
  extends TableSelectors<Entity, S>, BaseSchema<Record<IdProp, Entity>> {
  schema: "table";
  initialState: Record<IdProp, Entity>;
  add: (e: Record<IdProp, Entity>) => (s: S) => void;
  set: (e: Record<IdProp, Entity>) => (s: S) => void;
  remove: (ids: IdProp[]) => (s: S) => void;
  patch: (e: PatchEntity<Record<IdProp, Entity>>) => (s: S) => void;
  merge: (e: PatchEntity<Record<IdProp, Entity>>) => (s: S) => void;
  reset: () => (s: S) => void;
}

export const createTable = <
  Entity extends AnyState = AnyState,
  S extends AnyState = AnyState,
>({
  name,
  empty,
  initialState = {},
}: {
  name: keyof S;
  initialState?: Record<IdProp, Entity>;
  empty?: Entity | (() => Entity);
}): TableOutput<Entity, S> => {
  const selectors = tableSelectors<Entity, S>((s: S) => s[name], empty);

  return {
    schema: "table",
    name: name as string,
    initialState,
    add: (entities) => (s) => {
      const state = selectors.selectTable(s);
      Object.keys(entities).forEach((id) => {
        state[id] = entities[id];
      });
    },
    set: (entities) => (s) => {
      // deno-lint-ignore no-explicit-any
      (s as any)[name] = entities;
    },
    remove: (ids) => (s) => {
      const state = selectors.selectTable(s);
      ids.forEach((id) => {
        delete state[id];
      });
    },
    patch: (entities) => (s) => {
      const state = selectors.selectTable(s);
      Object.keys(entities).forEach((id) => {
        state[id] = { ...state[id], ...entities[id] };
      });
    },
    merge: (entities) => (s) => {
      const state = selectors.selectTable(s);
      Object.keys(entities).forEach((id) => {
        const entity = entities[id];
        Object.keys(entity).forEach((prop) => {
          const val = entity[prop];
          if (Array.isArray(val)) {
            // deno-lint-ignore no-explicit-any
            const list = val as any[];
            // deno-lint-ignore no-explicit-any
            (state as any)[id][prop].push(...list);
          } else {
            // deno-lint-ignore no-explicit-any
            (state as any)[id][prop] = entities[id][prop];
          }
        });
      });
    },
    reset: () => (s) => {
      // deno-lint-ignore no-explicit-any
      (s as any)[name] = initialState;
    },
    ...selectors,
  };
};

export function table<
  V extends AnyState = AnyState,
>({ initialState, empty }: {
  initialState?: Record<IdProp, V>;
  empty?: V | (() => V);
}) {
  return (name: string) => createTable<V>({ name, empty, initialState });
}
