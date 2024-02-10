import type { ThunkAction } from "./types.ts";
import type { ActionFnWithPayload } from "../types.ts";

export function getIdFromAction(
  action: ThunkAction | ActionFnWithPayload,
): string {
  return typeof action === "function" ? action.toString() : action.payload.key;
}
