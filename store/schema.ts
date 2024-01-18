import { updateStore } from "./fx.ts";
import { FxMap, FxSchema, StoreUpdater } from "./types.ts";

export function createSchema<
  O extends FxMap,
  S extends { [key in keyof O]: ReturnType<O[key]>["initialState"] },
>(
  slices: O,
): [FxSchema<S, O>, S] {
  const db = Object.keys(slices).reduce<FxSchema<S, O>>((acc, key) => {
    // deno-lint-ignore no-explicit-any
    (acc as any)[key] = slices[key](key);
    return acc;
  }, {} as FxSchema<S, O>);

  const initialState = Object.keys(db).reduce((acc, key) => {
    // deno-lint-ignore no-explicit-any
    (acc as any)[key] = db[key].initialState;
    return acc;
  }, {}) as S;

  function* update(
    ups:
      | StoreUpdater<S>
      | StoreUpdater<S>[],
  ) {
    return yield* updateStore(ups);
  }

  db.update = update;

  return [db, initialState];
}
