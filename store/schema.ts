import { AnyState } from "../types.ts";
import { updateStore } from "./fx.ts";
import { LoaderOutput } from "./slice/loader.ts";
import { TableOutput } from "./slice/table.ts";
import { BaseSchema, FxStore, StoreUpdater } from "./types.ts";

export function createSchema<
  O extends {
    [key: string]: <GS extends AnyState, N extends keyof GS>(name: N) => BaseSchema<unknown, GS, N>;
  },
  S extends { [key in keyof O]: ReturnType<O[key]>["initialState"] },
>(
  slices: O,
): {
  db: { [key in keyof O]: ReturnType<O[key]> };
  initialState: S;
  update: FxStore<S>["update"];
} {
  const db = Object.keys(slices).reduce((acc, key) => {
    // deno-lint-ignore no-explicit-any
    (acc as any)[key] = slices[key](key);
    return acc;
  }, {} as { [key in keyof O]: ReturnType<O[key]> });

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

  return { db, initialState, update };
}
