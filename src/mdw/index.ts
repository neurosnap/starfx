import * as queryMdw from "./query.js";
import * as storeMdw from "./store.js";

export const mdw = { ...queryMdw, ...storeMdw };
