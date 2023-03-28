import { contextualize } from "../context.ts";
import type { Task } from "../deps.ts";

export function* cancel<T>(task: Task<T>) {
  yield* task.halt();
  yield* contextualize("cancelled", true);
}
