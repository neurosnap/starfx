export function ensureArray(ar:any) {
  return Array.isArray(ar) ? ar : [ar].filter((f) => f !== undefined);
}


