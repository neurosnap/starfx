import * as queryMdw from "./query.ts";
import * as storeMdw from "./store.ts";

export const mdw = { ...queryMdw, ...storeMdw };
