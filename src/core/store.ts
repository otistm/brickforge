import { COLORS } from "../config/colors";
import { SHAPES } from "../config/shapes";
import type { Brick, BuildState, ShapeDef, Size, UndoAction } from "./types";

/** All placed bricks, in creation order. */
export const bricks: Brick[] = [];

/** Occupied grid cells -> owning brick id. Keys are "x,y,z". */
export const occupied = new Map<string, number>();

/** Undo history. */
export const undoStack: UndoAction[] = [];

let nextId = 1;
/** Returns a fresh, unique brick id. */
export function takeId(): number {
  return nextId++;
}

/** Current tool-rail selection. */
export const state: BuildState = {
  colorIdx: Math.max(0, COLORS.findIndex((c) => c[0] === "Red")),
  shape: "brick",
  size: [2, 4],
  rot: 0,
  tool: "build",
};

/** Runtime view flags shared between camera, loop and display mode. */
export const view = {
  isDisplay: false,
  autoRotate: false,
};

export function shapeDef(): ShapeDef {
  return SHAPES[state.shape];
}

/** Footprint after applying the current rotation. */
export function effSize(): Size {
  const [w, d] = state.size;
  return state.rot % 2 ? [d, w] : [w, d];
}

let changeHandler: (() => void) | null = null;

/**
 * Registers the callback fired whenever the brick set changes.
 * Wired in main.ts to refreshInventory, avoiding an engine -> feature cycle.
 */
export function onInventoryChange(fn: () => void): void {
  changeHandler = fn;
}

export function notifyChange(): void {
  changeHandler?.();
}
