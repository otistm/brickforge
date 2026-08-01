import type { ShapeKey } from "../core/types";
import { COLORS } from "./colors";

/**
 * Bundled, client-side mapping from a placed piece (shape + footprint) to its
 * real BrickLink design number, plus color-name -> BrickLink color id. This is
 * static reference data (no network); gaps are intentionally left out rather
 * than guessed, so we never display a wrong number.
 *
 * Footprint keys are normalized to `"{min}x{max}"` (orientation-independent),
 * matching how the inventory groups parts.
 */
export const PART_NUMBERS: Partial<Record<ShapeKey, Record<string, string>>> = {
  brick: {
    "1x1": "3005", "1x2": "3004", "1x3": "3622", "1x4": "3010", "1x6": "3009", "1x8": "3008",
    "2x2": "3003", "2x3": "3002", "2x4": "3001", "2x6": "2456", "2x8": "3007",
  },
  plate: {
    "1x1": "3024", "1x2": "3023", "1x3": "3623", "1x4": "3710", "1x6": "3666", "1x8": "3460",
    "2x2": "3022", "2x3": "3021", "2x4": "3020", "2x6": "3795", "2x8": "3034", "4x4": "3031",
  },
  tile: {
    "1x1": "3070b", "1x2": "3069b", "1x3": "63864", "1x4": "2431", "1x6": "6636", "1x8": "4162",
    "2x2": "3068b", "2x3": "26603", "2x4": "87079", "2x6": "69729",
  },
  jumper: { "1x2": "15573", "2x2": "87580" },
  // Roof tiles (45°) — LEGO catalog names "Roof Tile" / "Roof Tile Inv."
  slope: { "1x2": "3040", "2x2": "3039", "2x3": "3038", "2x4": "3037" },
  islope: { "1x2": "3665", "1x3": "2341", "2x2": "3660", "2x3": "3747" },
  cheese: { "1x1": "54200" },
  curve: { "1x2": "11477", "2x2": "15068" },
  rbrick: { "1x1": "3062b", "2x2": "3941" },
  rplate: { "1x1": "4073", "2x2": "4032" },
  cone: { "1x1": "4589", "2x2": "3942c" },
  arch: { "1x3": "4490", "1x4": "3659", "1x6": "3455" },
};

/** Color display name (as used in COLORS) -> BrickLink color id. */
export const BL_COLOR_BY_NAME: Record<string, number> = {
  White: 1,
  "Very Light Bluish Gray": 99,
  "Light Bluish Gray": 86,
  "Dark Bluish Gray": 85,
  Black: 11,
  Red: 5,
  "Dark Red": 59,
  Coral: 220,
  "Dark Pink": 47,
  Magenta: 71,
  "Dark Purple": 89,
  Purple: 24,
  "Medium Lavender": 157,
  "Dark Blue": 63,
  Blue: 7,
  "Medium Blue": 42,
  "Sand Blue": 55,
  "Dark Azure": 153,
  "Medium Azure": 156,
  "Dark Turquoise": 39,
  "Dark Green": 80,
  Green: 6,
  "Bright Green": 36,
  "Sand Green": 48,
  "Olive Green": 155,
  Lime: 34,
  Yellow: 3,
  "Bright Light Yellow": 103,
  "Bright Light Orange": 110,
  "Medium Orange": 31,
  Orange: 4,
  "Dark Orange": 68,
  "Reddish Brown": 88,
  "Dark Brown": 120,
  Nougat: 28,
  Tan: 2,
  "Dark Tan": 69,
};

/** Resolves a piece's BrickLink design number, or null when unmapped. */
export function lookupPart(shape: ShapeKey, w: number, d: number): string | null {
  const a = Math.min(w, d);
  const c = Math.max(w, d);
  return PART_NUMBERS[shape]?.[`${a}x${c}`] ?? null;
}

export interface PartLookup {
  shape: ShapeKey;
  w0: number;
  d0: number;
}

let reversePartMap: Map<string, PartLookup> | null = null;

function buildReversePartMap(): Map<string, PartLookup> {
  const map = new Map<string, PartLookup>();
  for (const shape of Object.keys(PART_NUMBERS) as ShapeKey[]) {
    const sizes = PART_NUMBERS[shape];
    if (!sizes) continue;
    for (const [footprint, part] of Object.entries(sizes)) {
      const [w0, d0] = footprint.split("x").map(Number) as [number, number];
      const key = part.toLowerCase();
      if (!map.has(key)) map.set(key, { shape, w0, d0 });
    }
  }
  return map;
}

/** Resolves a BrickLink/Brickognize design id back to a builder piece, if known. */
export function lookupByPartNumber(partId: string): PartLookup | null {
  if (!reversePartMap) reversePartMap = buildReversePartMap();
  const raw = partId.trim().toLowerCase();
  if (!raw) return null;
  const direct = reversePartMap.get(raw);
  if (direct) return direct;
  // Brickognize sometimes returns mold variants (e.g. 3070b → 3070).
  const base = raw.replace(/[a-z]+$/i, "");
  if (base && base !== raw) return reversePartMap.get(base) ?? null;
  return null;
}

/** Resolves a color index to its BrickLink color id, or null when unknown. */
export function blColorId(colorIdx: number): number | null {
  const entry = COLORS[colorIdx];
  if (!entry) return null;
  return BL_COLOR_BY_NAME[entry[0]] ?? null;
}

/** BrickLink catalog page for a known part, optionally pinned to a color tab. */
export function brickLinkUrl(part: string, colorId?: number | null): string {
  const base = `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${encodeURIComponent(part)}`;
  return colorId != null ? `${base}#T=C&C=${colorId}` : base;
}

/** BrickLink search fallback used when there's no exact part match. */
export function brickLinkSearchUrl(name: string): string {
  return `https://www.bricklink.com/v2/search.page?q=${encodeURIComponent(name)}`;
}
