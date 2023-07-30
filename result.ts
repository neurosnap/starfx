import { Ok, Result } from "./deps.ts";

export function resultAll<T>(results: Result<T>[]): Result<T[]> {
  const agg: T[] = [];
  for (let i = 0; i < results.length; i += 1) {
    const result = results[i];
    if (result.ok) {
      agg.push(result.value);
    } else {
      return result;
    }
  }
  return Ok(agg);
}
