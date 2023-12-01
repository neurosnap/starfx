import { str, StrOutput } from "./str.ts";
import { num, NumOutput } from "./num.ts";
import { table, TableOutput } from "./table.ts";
import { any, AnyOutput } from "./any.ts";
import { obj, ObjOutput } from "./obj.ts";
import {
  defaultLoader,
  defaultLoaderItem,
  loader,
  LoaderOutput,
} from "./loader.ts";
export const slice = {
  str,
  num,
  table,
  any,
  obj,
  loader,
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
