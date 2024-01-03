import { React, useSelector } from "../deps.ts";
import { PERSIST_LOADER_ID } from "./persist.ts";
import type { LoaderOutput } from "./slice/mod.ts";

interface PersistGateProps {
  children: React.ReactNode;
  loading?: JSX.Element;
  loader: LoaderOutput<any, any>;
}

function Loading({ text }: { text: string }) {
  return React.createElement("div", null, text);
}

export function PersistGate(
  { loader, children, loading = React.createElement(Loading) }:
    PersistGateProps,
) {
  const ldr = useSelector((s) =>
    loader.selectById(s, { id: PERSIST_LOADER_ID })
  );

  if (ldr.status === "error") {
    return React.createElement("div", null, ldr.message);
  }

  if (ldr.status !== "success") {
    return loading;
  }

  return children;
}
