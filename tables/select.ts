import { createSelector } from "../deps.ts";
import type { MapEntity } from "../deps.ts";

import type { RootState } from "../types.ts";
const _selectSlice =
  <K extends keyof RootState>(sliceName: K) => (s: RootState) => s[sliceName];
/**
 * Selector of a whole slice, by slice name
 * @param {K} sliceName
 * @returns { (s: RootState) => RootState[K] }
 * @example const selectApp = selectSlice('app');
 */
export const selectSlice = <K extends keyof RootState>(sliceName: K) =>
  createSelector(_selectSlice(sliceName), (s) => s);

export type TFxSliceSelector<T> = (state: RootState) => T;

export type TFXMapEntitySelector<T> = (state: RootState) => MapEntity<T>;
