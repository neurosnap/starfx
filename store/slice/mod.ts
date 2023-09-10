import { str } from "./str.ts";
import { num } from "./num.ts";
import { table } from "./table.ts";
import { any } from "./any.ts";
import { obj } from "./obj.ts";
import { defaultLoader, defaultLoaderItem, loader } from "./loader.ts";
export const slice = {
  str,
  num,
  table,
  any,
  obj,
  loader,
};
export { defaultLoader, defaultLoaderItem };