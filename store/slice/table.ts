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

function tableSelectors<
  Entity extends AnyState = AnyState,
  S extends AnyState = AnyState,
>(
  selectTable: (s: S) => Record<IdProp, Entity>,
  empty?: Entity | (() => Entity) | undefined,
) {
  const must = empty ? mustSelectEntity(empty) : null;
  const tableAsList = (data: Record<IdProp, Entity>): Entity[] =>
    Object.values(data).filter(excludesFalse);
  const findById = (data: Record<IdProp, Entity>, { id }: PropId) => data[id];
  const findByIds = (
    data: Record<IdProp, Entity>,
    { ids }: PropIds,
  ): Entity[] => ids.map((id) => data[id]).filter(excludesFalse);
  const selectById = (
    state: S,
    { id }: PropId,
  ): typeof empty extends undefined ? (Entity | undefined) : Entity => {
    const data = selectTable(state);
    return findById(data, { id });
  };

  const sbi = must ? must(selectById) : selectById;

  return {
    findById: must ? must(findById) : findById,
    findByIds,
    tableAsList,
    selectTable,
    selectTableAsList: createSelector(
      selectTable,
      (data): Entity[] => tableAsList(data),
    ),
    selectById: sbi,
    selectByIds: createSelector(
      selectTable,
      (_: S, p: PropIds) => p,
      findByIds,
    ),
  };
}

export interface TableOutput<
  Entity extends AnyState,
  GS extends AnyState,
  N extends keyof GS,
  Empty extends Entity | undefined = Entity | undefined,
> extends BaseSchema<Record<IdProp, Entity>, GS, N> {
  schema: "table";
  initialState: Record<IdProp, Entity>;
  empty: Empty;
  add: (e: Record<IdProp, Entity>) => (s: GS) => void;
  set: (e: Record<IdProp, Entity>) => (s: GS) => void;
  remove: (ids: IdProp[]) => (s: GS) => void;
  patch: (e: PatchEntity<Record<IdProp, Entity>>) => (s: GS) => void;
  merge: (e: PatchEntity<Record<IdProp, Entity>>) => (s: GS) => void;
  reset: () => (s: GS) => void;
  findById: (
    d: Record<IdProp, Entity>,
    { id }: PropId,
  ) => Empty;
  findByIds: (d: Record<IdProp, Entity>, { ids }: PropIds) => Entity[];
  tableAsList: (d: Record<IdProp, Entity>) => Entity[];
  selectTable: (s: GS) => Record<IdProp, Entity>;
  selectTableAsList: (state: GS) => Entity[];
  selectById: (
    s: GS,
    p: PropId,
  ) => Empty;
  selectByIds: (s: GS, p: PropIds) => Entity[];
}

export function createTable<
  Entity extends AnyState = AnyState,
  GS extends AnyState = AnyState,
  N extends keyof GS = keyof GS,
>(p: {
  name: N;
  initialState?: Record<IdProp, Entity>;
  empty: Entity | (() => Entity);
}): TableOutput<Entity, GS, N, Entity>;
export function createTable<
  Entity extends AnyState = AnyState,
  GS extends AnyState = AnyState,
  N extends keyof GS = keyof GS,
>(p: {
  name: N;
  initialState?: Record<IdProp, Entity>;
  empty?: Entity | (() => Entity);
}): TableOutput<Entity, GS, N, Entity | undefined>;
export function createTable<
  Entity extends AnyState = AnyState,
  GS extends AnyState = AnyState,
  N extends keyof GS = keyof GS,
>({
  name,
  empty,
  initialState = {},
}: {
  name: N;
  initialState?: Record<IdProp, Entity>;
  empty?: Entity | (() => Entity);
}): TableOutput<Entity, GS, N, Entity | undefined> {
  const selectors = tableSelectors<Entity, Pick<GS, N>>((s: Pick<GS, N>) => s[name], empty);

  return {
    schema: "table",
    name: name,
    initialState,
    empty: typeof empty === "function" ? empty() : empty,
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
}

export function table<
  Entity extends AnyState = AnyState,
>(p: {
  initialState?: Record<IdProp, Entity>;
  empty: Entity | (() => Entity);
}): <S extends AnyState, N extends keyof S>(n: N) => TableOutput<Entity, S, N, Entity>;
export function table<
  Entity extends AnyState = AnyState,
>(p?: {
  initialState?: Record<IdProp, Entity>;
  empty?: Entity | (() => Entity);
}): <S extends AnyState, N extends keyof S>(n: N) => TableOutput<Entity, S, N, Entity | undefined>;
export function table<
  Entity extends AnyState = AnyState,
>(
  { initialState, empty }: {
    initialState?: Record<IdProp, Entity>;
    empty?: Entity | (() => Entity);
  } = {},
): <S extends AnyState, N extends keyof S>(n: N) => TableOutput<Entity, S, N, Entity | undefined> {
  return <S extends AnyState, N extends keyof S>(name: N) => createTable<Entity, S, N>({ name, empty, initialState });
}
