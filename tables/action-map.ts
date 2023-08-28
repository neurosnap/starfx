import { mapReducers } from "../deps.ts";
import { match, P } from "../deps.ts";
import { call } from "../fx/call.ts";
import { take, updateStore } from "../store/mod.ts";
import { ensureArray } from "./utils.ts";
import type { AnyState, FxStore } from "../store/types.ts";
import type { QueryState } from "../types.ts";

const setSuffix = "/set";
const resetSuffix = "/reset";
const addSuffix = "/add";
const removeSuffix = "/remove";
const patchSuffix = "/patch";
const mergeSuffix = "/merge";
const starfxPrefix = "@@starfx/";

type TInitialStore = AnyState & { [key: string]: unknown };
export type RootState = QueryState & TInitialStore;

let globalStore: FxStore<RootState>;
let initialState: RootState;

export function setGlobalStore(store: FxStore<RootState>) {
  globalStore = store;
  initialState = store.getInitialState();
}

export function setSlice<K extends keyof RootState>(
  key: K,
  value: RootState[K],
) {
  return function (state: RootState) {
    state[key] = value as (typeof state)[K];
  };
}

function sxnext(action: any) {
  const fx = globalStore;
  const storeKeys = Object.keys(globalStore.getState());

  const setRegexPattern = new RegExp(
    `^${starfxPrefix}(${storeKeys.join("|")})${setSuffix}$`,
  );
  const resetRegexPattern = new RegExp(
    `^${starfxPrefix}(${storeKeys.join("|")})${resetSuffix}$`,
  );
  const addRegexPattern = new RegExp(
    `^${starfxPrefix}(${storeKeys.join("|")})${addSuffix}$`,
  );
  const removeRegexPattern = new RegExp(
    `^${starfxPrefix}(${storeKeys.join("|")})${removeSuffix}$`,
  );
  const patchRegexPattern = new RegExp(
    `^${starfxPrefix}(${storeKeys.join("|")})${patchSuffix}$`,
  );
  const mergeRegexPattern = new RegExp(
    `^${starfxPrefix}(${storeKeys.join("|")})${mergeSuffix}$`,
  );

  return match(action)
    .with(
      { type: P.string.regex(setRegexPattern), payload: P.any },
      ({ type, payload }) => {
        const sliceName = type.replace(setRegexPattern, "$1");
        fx.run(function* () {
          yield* updateStore(
            setSlice(sliceName as keyof RootState, payload as any),
          );
        });
      },
    )
    .with({ type: P.string.regex(resetRegexPattern) }, ({ type }) => {
      const sliceName = type.replace(resetRegexPattern, "$1");

      fx.run(function* () {
        yield* updateStore(
          setSlice(sliceName as keyof RootState, initialState[sliceName]),
        );
      });
    })
    .with(
      { type: P.string.regex(addRegexPattern), payload: P.any },
      ({ type, payload }) => {
        const sliceName = type.replace(addRegexPattern, "$1");
        const current = fx.getState()[sliceName];
        const newState = mapReducers().add(current, payload as any);
        fx.run(function* () {
          yield* updateStore(setSlice(sliceName as keyof RootState, newState));
        });
      },
    )
    .with(
      { type: P.string.regex(removeRegexPattern), payload: P.any },
      ({ type, payload }) => {
        const sliceName = type.replace(removeRegexPattern, "$1");
        const current = fx.getState()[sliceName];
        const arrPayload = ensureArray(payload);
        const newState = mapReducers().remove(current, arrPayload);
        fx.run(function* () {
          yield* updateStore(setSlice(sliceName as keyof RootState, newState));
        });
      },
    )
    .with(
      { type: P.string.regex(patchRegexPattern), payload: P.any },
      ({ type, payload }) => {
        const sliceName = type.replace(patchRegexPattern, "$1");
        const current = fx.getState()[sliceName];
        const newState = mapReducers().patch(
          current,
          payload as { [key: string]: Partial<RootState[keyof RootState]> },
        );
        fx.run(function* () {
          yield* updateStore(setSlice(sliceName as keyof RootState, newState));
        });
      },
    )
    .with(
      { type: P.string.regex(mergeRegexPattern), payload: P.any },
      ({ type, payload }) => {
        const sliceName = type.replace(mergeRegexPattern, "$1");
        const current = fx.getState()[sliceName];
        const newState = mapReducers().merge(
          current,
          payload as { [key: string]: Partial<RootState[keyof RootState]> },
        );
        fx.run(function* () {
          yield* updateStore(setSlice(sliceName as keyof RootState, newState));
        });
      },
    )
    .otherwise(() => {
      if (
        [
          setSuffix,
          resetSuffix,
          addSuffix,
          removeSuffix,
          patchSuffix,
          mergeSuffix,
        ].some((suffix) => action.type.endsWith(suffix))
      ) {
        console.log(
          "You probably forgot to register the repo of: ",
          action,
          " in the rootStore",
        );
      }
    });
}
export function* tablesTakeEvery() {
  while (true) {
    const next = yield* take("*");
    yield* call(() => sxnext(next));
  }
}
