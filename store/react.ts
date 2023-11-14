import { AnyState } from "../types.ts";
import { LoaderItemOutput } from "./slice/loader.ts";
import { React, useSelector } from "../deps.ts";

interface PersistGateProps {
  loader: LoaderItemOutput<AnyState, AnyState>;
  children: React.ReactNode;
  loading?: JSX.Element;
}

function Loading({ text }: { text: string }) {
  return React.createElement("div", null, text);
}

export function PersistGate(
  { loader, loading = React.createElement(Loading), children }:
    PersistGateProps,
) {
  const loaderItem = useSelector(loader.select);

  if (loaderItem.status === "error") {
    return React.createElement("div", null, loaderItem.message);
  }

  if (loaderItem.status !== "success") {
    return loading;
  }

  return React.createElement("div", null, children);
}
