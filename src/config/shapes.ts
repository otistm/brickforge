import type { ShapeDef, ShapeKey, Size } from "../core/types";

export const ALL_SIZES: Size[] = [
  [1, 1], [1, 2], [1, 3], [1, 4], [1, 6], [1, 8], [2, 2], [2, 3], [2, 4], [2, 6], [2, 8], [4, 4],
];
export const SLOPE_SIZES: Size[] = [[1, 1], [1, 2], [2, 2], [1, 3], [2, 3], [2, 4]];
export const ROUND_SIZES: Size[] = [[1, 1], [2, 2]];
export const ARCH_SIZES: Size[] = [[3, 1], [4, 1], [6, 1], [4, 2]];
export const CHEESE_SIZES: Size[] = [[1, 1]];
export const CURVE_SIZES: Size[] = [[1, 2], [2, 2]];
export const JUMPER_SIZES: Size[] = [[1, 2], [2, 2]];

/** Render/sort order for pieces. */
export const SHAPE_KEYS: ShapeKey[] = [
  "brick", "plate", "tile", "jumper", "slope", "islope", "cheese", "curve", "rbrick", "rplate", "cone", "arch",
];

export const SHAPES: Record<ShapeKey, ShapeDef> = {
  brick:  { label: "Brick",       h: 3, studs: "full",    geo: "box",    sizes: ALL_SIZES },
  plate:  { label: "Plate",       h: 1, studs: "full",    geo: "box",    sizes: ALL_SIZES },
  tile:   { label: "Tile",        h: 1, studs: "none",    geo: "box",    sizes: ALL_SIZES },
  jumper: { label: "Jumper",      h: 1, studs: "center1", geo: "box",    sizes: JUMPER_SIZES },
  slope:  { label: "Roof Tile",      h: 3, studs: "back",    geo: "slope",  sizes: SLOPE_SIZES },
  islope: { label: "Roof Tile Inv",  h: 3, studs: "full",    geo: "islope", sizes: SLOPE_SIZES },
  cheese: { label: "Cheese",      h: 2, studs: "none",    geo: "cheese", sizes: CHEESE_SIZES },
  curve:  { label: "Curved",      h: 2, studs: "none",    geo: "curve",  sizes: CURVE_SIZES },
  rbrick: { label: "Round",       h: 3, studs: "full",    geo: "cyl",    sizes: ROUND_SIZES },
  rplate: { label: "Round Plate", h: 1, studs: "full",    geo: "cyl",    sizes: ROUND_SIZES },
  cone:   { label: "Cone",        h: 3, studs: "top1",    geo: "cone",   sizes: ROUND_SIZES },
  arch:   { label: "Arch",        h: 3, studs: "full",    geo: "arch",   sizes: ARCH_SIZES },
};
