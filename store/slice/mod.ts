import { str, type StrOutput } from "./str.ts";
import { num, type NumOutput } from "./num.ts";
import { table, type TableOutput } from "./table.ts";
import { any, type AnyOutput } from "./any.ts";
import { obj, type ObjOutput } from "./obj.ts";
import {
  defaultLoader,
  defaultLoaderItem,
  type LoaderOutput,
  loaders,
} from "./loaders.ts";

export const slice = {
  str,
  num,
  table,
  any,
  obj,
  loaders,
  /**
   * @deprecated Use `slice.loaders` instead
   */
  loader: loaders,
};
export { defaultLoader, defaultLoaderItem };
export type {
  AnyOutput,
  LoaderOutput,
  NumOutput,
  ObjOutput,
  StrOutput,
  TableOutput,
};
