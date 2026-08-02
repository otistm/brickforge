import type { ShapeKey } from "../core/types";

/**
 * The physical part collection, transcribed from the set inventory pages the
 * user photographed: a Classic-style brick box (plain bricks in six sizes
 * across a handful of colours) plus two accessory pages carrying the greys,
 * plates, tiles, slopes and curved slopes.
 *
 * Presets are validated against this table so every built-in model is one that
 * can actually be assembled from the bin. Anything not listed here simply does
 * not exist as far as the presets are concerned — notably there are no round
 * bricks, cones, inverted slopes, cheese slopes, jumpers or 4x4 plates in the
 * collection, which is why the presets are built almost entirely from bricks.
 */

/** Colour indices into COLORS, narrowed to the colours visible in the photos. */
export const PALETTE = {
  W: 0,
  LBG: 2,
  DBG: 3,
  K: 4,
  R: 5,
  DR: 6,
  DP: 8,
  MG: 9,
  PU: 11,
  BLU: 14,
  DAZ: 17,
  MAZ: 18,
  DG: 20,
  G: 21,
  LM: 25,
  Y: 26,
  OR: 30,
  RB: 32,
  DB: 33,
  T: 35,
} as const;

const C = PALETTE;

/** [width, depth, count] as printed in the inventory. */
type SizeQty = readonly [w: number, d: number, qty: number];

const owned = new Map<string, number>();

function slot(shape: ShapeKey, w0: number, d0: number, ci: number): string {
  return `${shape}|${w0}x${d0}|${ci}`;
}

function add(shape: ShapeKey, ci: number, entries: readonly SizeQty[]): void {
  for (const [w, d, qty] of entries) {
    const k = slot(shape, w, d, ci);
    owned.set(k, (owned.get(k) ?? 0) + qty);
  }
}

/* ------------------------------------------------------------------ */
/*  Classic brick box — the same six brick sizes in every full colour  */
/* ------------------------------------------------------------------ */

const CLASSIC_RUN: readonly SizeQty[] = [
  [1, 1, 14],
  [1, 2, 20],
  [2, 2, 20],
  [1, 4, 8],
  [2, 4, 32],
  [2, 6, 4],
];

for (const ci of [C.W, C.R, C.K, C.G, C.Y, C.RB]) add("brick", ci, CLASSIC_RUN);

// Blue's 1x1 slot in the box is taken by dark azure instead.
add("brick", C.BLU, [
  [1, 2, 20],
  [2, 2, 20],
  [1, 4, 8],
  [2, 4, 32],
  [2, 6, 4],
]);
add("brick", C.DAZ, [[1, 1, 14]]);

// Dark pink runs the box without a 1x4; magenta only shows up as a 1x1.
add("brick", C.DP, [
  [1, 1, 20],
  [1, 2, 20],
  [2, 2, 8],
  [2, 4, 32],
  [2, 6, 4],
]);
add("brick", C.MG, [[1, 1, 14]]);
add("brick", C.LM, [[2, 6, 4]]);

/* ------------------------------------------------------------------ */
/*  Accessory page — greys, purple, pink, dark red, extra yellow       */
/* ------------------------------------------------------------------ */

add("brick", C.LBG, [
  [1, 1, 4],
  [1, 2, 8],
  [2, 2, 4],
  [1, 4, 4],
]);
add("brick", C.DBG, [[2, 4, 3]]);
add("plate", C.DBG, [
  [2, 3, 2],
  [2, 4, 2],
  [2, 8, 2],
]);
add("tile", C.DBG, [[2, 4, 4]]);
add("rplate", C.LBG, [[1, 1, 2]]);
add("slope", C.DBG, [[2, 2, 4]]);

add("brick", C.PU, [
  [1, 2, 4],
  [2, 2, 4],
  [2, 4, 4],
]);
add("slope", C.PU, [[2, 2, 4]]);
add("rplate", C.PU, [[1, 1, 3]]);

add("brick", C.DP, [
  [1, 2, 8],
  [2, 2, 8],
  [2, 4, 4],
]);
add("rplate", C.DP, [[1, 1, 3]]);

add("brick", C.DR, [
  [2, 2, 8],
  [1, 6, 2],
]);
add("brick", C.Y, [
  [1, 2, 8],
  [1, 4, 8],
]);
add("brick", C.RB, [[1, 1, 8]]);

/* ------------------------------------------------------------------ */
/*  Slope / curved-slope page                                          */
/* ------------------------------------------------------------------ */

const SLOPE_COLORS = [C.DAZ, C.MAZ, C.BLU, C.OR, C.PU, C.LM, C.MG, C.T, C.DR, C.DG, C.RB, C.DB];
for (const ci of SLOPE_COLORS) {
  add("slope", ci, [[2, 2, 4]]);
  add("curve", ci, [
    [1, 2, 4],
    [2, 2, 4],
  ]);
}

/** How many of a given part the collection holds. Zero means "not owned". */
export function ownedQty(shape: ShapeKey, w0: number, d0: number, ci: number): number {
  return owned.get(slot(shape, w0, d0, ci)) ?? 0;
}
