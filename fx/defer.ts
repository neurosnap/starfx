import { resource } from "../deps.ts";
import type { Operation } from "../deps.ts";

export function defer(op: () => Operation<unknown>): Operation<void> {
  return resource(function* (provide) {
    try {
      yield* provide();
    } finally {
      yield* op();
    }
  });
}
