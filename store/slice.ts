import type {
  IdProp,
  LoadingItemState,
  LoadingPayload,
  LoadingState,
  LoadingStatus,
} from "../types.ts";
import type { QueryState } from "../types.ts";

export const defaultLoader = (
  p: Partial<LoadingItemState> = {},
): LoadingItemState => {
  return {
    id: "",
    status: "idle",
    message: "",
    lastRun: 0,
    lastSuccess: 0,
    meta: {},
    ...p,
  };
};

export const selectLoaderTable = (s: QueryState) => {
  return s["@@starfx/loaders"] || {};
};

const initLoader = defaultLoader();
export const selectLoaderById = (
  s: QueryState,
  { id }: { id: IdProp },
): LoadingState => {
  const base = selectLoaderTable(s)[id] || initLoader;
  return {
    ...base,
    isIdle: base.status === "idle",
    isError: base.status === "error",
    isSuccess: base.status === "success",
    isLoading: base.status === "loading",
    isInitialLoading: (base.status === "idle" || base.status === "loading") &&
      base.lastSuccess === 0,
  };
};

const setLoaderState = (status: LoadingStatus) => {
  return (props: LoadingPayload) => {
    function updateLoadingState(s: QueryState) {
      if (!props.id) return;
      const loaders = selectLoaderTable(s);
      if (!loaders[props.id]) {
        loaders[props.id] = defaultLoader({ ...props });
        return;
      }

      const loader = loaders[props.id];
      loader.status = status;
      if (props.meta) {
        loader.meta = props.meta;
      }
      if (props.message) {
        loader.message = props.message;
      }
    }
    return updateLoadingState;
  };
};
export const setLoaderStart = setLoaderState("loading");
export const setLoaderSuccess = setLoaderState("success");
export const setLoaderError = setLoaderState("error");
export const resetLoaderById = ({ id }: { id: string }) => {
  function resetLoader(s: QueryState) {
    const loaders = selectLoaderTable(s);
    delete loaders[id];
  }
  return resetLoader;
};

export const selectDataTable = (s: QueryState) => {
  return s["@@starfx/data"] || {};
};

export const selectDataById = (s: QueryState, { id }: { id: IdProp }) => {
  return selectDataTable(s)[id];
};

export const addData = (props: { [key: string]: unknown }) => {
  function addDataState(s: QueryState) {
    s["@@starfx/data"] = { ...s["@@starfx/data"], ...props };
  }
  return addDataState;
};
