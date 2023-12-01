import { React, useSelector } from "../deps.ts";
import { QueryState, selectLoaderById } from "./selectors.ts";
import { PERSIST_LOADER_ID } from "./persist.ts";

interface PersistGateProps {
  children: React.ReactNode;
  loading?: JSX.Element;
}

function Loading({ text }: { text: string }) {
  return React.createElement("div", null, text);
}

export function PersistGate(
  { loading = React.createElement(Loading), children }: PersistGateProps,
) {
  const loader = useSelector((s: QueryState) =>
    selectLoaderById(s, { id: PERSIST_LOADER_ID })
  );

  if (loader.status === "error") {
    return React.createElement("div", null, loader.message);
  }

  if (loader.status !== "success") {
    return loading;
  }

  return React.createElement("div", null, children);
}
