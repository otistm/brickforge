import type { ShapeKey } from "../core/types";
import { SHAPES } from "./shapes";

/** One piece in a preset, authored in grid / plate units. */
export interface PresetBrick {
  gx: number;
  gy: number;
  gz: number;
  w0: number;
  d0: number;
  shape: ShapeKey;
  ci: number;
  rot?: number;
}

export interface Preset {
  id: string;
  name: string;
  blurb: string;
  /** CSS color for the card accent chip. */
  accent: string;
  bricks: PresetBrick[];
}

/* Color indices into COLORS */
const W = 0;
const LBG = 2;
const DBG = 3;
const K = 4;
const R = 5;
const DR = 6;
const DP = 10;
const P = 11;
const ML = 12;
const BLU = 14;
const DG = 20;
const G = 21;
const Y = 26;
const BLY = 27;
const BLO = 28;
const RB = 32;
const DB = 33;
const T = 35;
const DT = 36;

function p(
  gx: number,
  gy: number,
  gz: number,
  w0: number,
  d0: number,
  shape: ShapeKey,
  ci: number,
  rot = 0
): PresetBrick {
  return { gx, gy, gz, w0, d0, shape, ci, rot };
}

/**
 * Validates a preset against the same rules the builder enforces at placement
 * time: real part sizes, no shared cells, and every piece resting on either the
 * baseplate or a piece below it. Throws on the first problem found.
 */
export function assertPresetValid(preset: Preset): void {
  const owners = new Map<string, PresetBrick>();

  for (const b of preset.bricks) {
    const def = SHAPES[b.shape];
    if (!def.sizes.some(([w, d]) => w === b.w0 && d === b.d0)) {
      throw new Error(
        `Preset "${preset.id}": ${b.shape} has no ${b.w0}x${b.d0} size`
      );
    }
    const rot = b.rot ?? 0;
    const ew = rot % 2 ? b.d0 : b.w0;
    const ed = rot % 2 ? b.w0 : b.d0;
    for (let x = b.gx; x < b.gx + ew; x++) {
      for (let z = b.gz; z < b.gz + ed; z++) {
        for (let y = b.gy; y < b.gy + def.h; y++) {
          const key = `${x},${y},${z}`;
          if (owners.has(key)) {
            throw new Error(`Preset "${preset.id}" overlaps at ${key}`);
          }
          owners.set(key, b);
        }
      }
    }
  }

  for (const b of preset.bricks) {
    if (b.gy === 0) continue;
    const rot = b.rot ?? 0;
    const ew = rot % 2 ? b.d0 : b.w0;
    const ed = rot % 2 ? b.w0 : b.d0;
    let supported = false;
    for (let x = b.gx; x < b.gx + ew && !supported; x++) {
      for (let z = b.gz; z < b.gz + ed && !supported; z++) {
        const below = owners.get(`${x},${b.gy - 1},${z}`);
        if (below && below !== b) supported = true;
      }
    }
    if (!supported) {
      throw new Error(
        `Preset "${preset.id}": floating ${b.shape} at ${b.gx},${b.gy},${b.gz}`
      );
    }
  }
}

/* ================================================================== */
/*  Apple — round purple fruit: narrow foot, flared skirt, domed top   */
/* ================================================================== */
const APPLE: PresetBrick[] = [
  // Foot — small round disc so the fruit sits on a point, not a slab
  p(-2, 0, -2, 2, 2, "rplate", DP),
  p(0, 0, -2, 2, 2, "rplate", DP),
  p(-2, 0, 0, 2, 2, "rplate", DP),
  p(0, 0, 0, 2, 2, "rplate", DP),

  // Skirt — inverted roof tiles flare 4 wide out to 6, round corners
  p(-3, 1, -3, 2, 2, "rbrick", DP),
  p(1, 1, -3, 2, 2, "rbrick", DP),
  p(-3, 1, 1, 2, 2, "rbrick", DP),
  p(1, 1, 1, 2, 2, "rbrick", DP),
  p(-1, 1, -3, 2, 2, "islope", DP),
  p(-1, 1, 1, 2, 2, "islope", DP, 2),
  p(-3, 1, -1, 2, 2, "islope", DP, 1),
  p(1, 1, -1, 2, 2, "islope", DP, 3),
  p(-1, 1, -1, 2, 2, "brick", P),

  // Equator — widest course, round corners, lavender cheek
  p(-3, 4, -3, 2, 2, "rbrick", P),
  p(1, 4, -3, 2, 2, "rbrick", P),
  p(-3, 4, 1, 2, 2, "rbrick", P),
  p(1, 4, 1, 2, 2, "rbrick", P),
  p(-1, 4, -3, 2, 2, "brick", P),
  p(-1, 4, 1, 2, 2, "brick", P),
  p(-3, 4, -1, 2, 2, "brick", ML),
  p(1, 4, -1, 2, 2, "brick", P),
  p(-1, 4, -1, 2, 2, "brick", P),

  // Shoulder — roof tiles pull 6 wide back in to 4, corners left open
  p(-2, 7, -2, 2, 2, "brick", P),
  p(0, 7, -2, 2, 2, "brick", P),
  p(-2, 7, 0, 2, 2, "brick", P),
  p(0, 7, 0, 2, 2, "brick", P),
  p(-2, 7, -3, 1, 1, "slope", P),
  p(-1, 7, -3, 1, 1, "slope", P),
  p(0, 7, -3, 1, 1, "slope", P),
  p(1, 7, -3, 1, 1, "slope", P),
  p(-2, 7, 2, 1, 1, "slope", P, 2),
  p(-1, 7, 2, 1, 1, "slope", P, 2),
  p(0, 7, 2, 1, 1, "slope", P, 2),
  p(1, 7, 2, 1, 1, "slope", P, 2),
  p(-3, 7, -2, 1, 1, "slope", P, 1),
  p(-3, 7, -1, 1, 1, "slope", P, 1),
  p(-3, 7, 0, 1, 1, "slope", P, 1),
  p(-3, 7, 1, 1, 1, "slope", P, 1),
  p(2, 7, -2, 1, 1, "slope", P, 3),
  p(2, 7, -1, 1, 1, "slope", P, 3),
  p(2, 7, 0, 1, 1, "slope", P, 3),
  p(2, 7, 1, 1, 1, "slope", P, 3),

  // Dome — second taper, 4 wide down to 2
  p(-1, 10, -1, 2, 2, "rbrick", P),
  p(-1, 10, -2, 1, 1, "slope", P),
  p(0, 10, -2, 1, 1, "slope", P),
  p(-1, 10, 1, 1, 1, "slope", P, 2),
  p(0, 10, 1, 1, 1, "slope", P, 2),
  p(-2, 10, -1, 1, 1, "slope", P, 1),
  p(-2, 10, 0, 1, 1, "slope", P, 1),
  p(1, 10, -1, 1, 1, "slope", P, 3),
  p(1, 10, 0, 1, 1, "slope", P, 3),

  // Crown well
  p(-1, 13, -1, 2, 2, "rplate", DP),

  // Stem and leaf — cheese sits on the tall end of the curve (local -z)
  p(0, 14, 0, 1, 1, "rbrick", RB),
  p(0, 17, 0, 1, 1, "cone", RB),
  p(-1, 14, -1, 1, 2, "curve", G),
  p(-1, 16, -1, 1, 1, "cheese", DG, 2),
];

/* ================================================================== */
/*  Sword — grip, twin crossguard, and a 3-wide blade                  */
/* ================================================================== */
const SWORD: PresetBrick[] = [
  // Pedestal
  p(-2, 0, -2, 4, 4, "plate", DBG),
  p(-1, 1, -1, 2, 2, "tile", K),
  p(-1, 2, -1, 2, 2, "rplate", K),

  // Pommel
  p(-1, 3, -1, 2, 2, "rbrick", BLO),
  p(0, 6, 0, 1, 1, "rplate", Y),

  // Grip, banded
  p(0, 7, 0, 1, 1, "brick", RB),
  p(0, 10, 0, 1, 1, "brick", DB),
  p(0, 13, 0, 1, 1, "brick", RB),
  p(0, 16, 0, 1, 1, "rbrick", DB),

  // Lower crossguard arm, spanning x over the grip
  p(-3, 19, 0, 1, 6, "brick", BLO, 1),
  p(-3, 22, 0, 1, 1, "cheese", BLY, 3),
  p(2, 22, 0, 1, 1, "cheese", BLY, 1),

  // Upper crossguard arm, spanning z over the lower arm
  p(0, 22, -3, 1, 6, "brick", Y),
  p(0, 25, -3, 1, 1, "cheese", BLY, 2),
  p(0, 25, 2, 1, 1, "cheese", BLY),

  // Ricasso — first blade course spans the guard so the edges land on it
  p(-1, 25, 0, 1, 3, "brick", LBG, 1),

  // Blade — bright edges either side of a dark fuller
  p(-1, 28, 0, 1, 1, "brick", W),
  p(0, 28, 0, 1, 1, "brick", DBG),
  p(1, 28, 0, 1, 1, "brick", W),
  p(-1, 31, 0, 1, 1, "brick", LBG),
  p(0, 31, 0, 1, 1, "brick", DBG),
  p(1, 31, 0, 1, 1, "brick", LBG),
  p(-1, 34, 0, 1, 1, "brick", W),
  p(0, 34, 0, 1, 1, "brick", DBG),
  p(1, 34, 0, 1, 1, "brick", W),
  p(-1, 37, 0, 1, 1, "brick", LBG),
  p(0, 37, 0, 1, 1, "brick", DBG),
  p(1, 37, 0, 1, 1, "brick", LBG),

  // Point
  p(-1, 40, 0, 1, 3, "brick", W, 1),
  p(-1, 43, 0, 1, 1, "cheese", LBG, 3),
  p(1, 43, 0, 1, 1, "cheese", LBG, 1),
  p(0, 43, 0, 1, 1, "cone", LBG),
];

/* ================================================================== */
/*  Horn — stepped spiral, each course overlapping the one below       */
/* ================================================================== */
const HORN: PresetBrick[] = [
  // Mount
  p(-2, 0, -2, 4, 4, "plate", DT),
  p(-1, 1, -1, 2, 2, "rplate", RB),
  p(-1, 2, -1, 2, 2, "rbrick", T),

  // Lower shaft
  p(-1, 5, -1, 2, 2, "brick", T),

  // Step toward +x
  p(0, 8, -1, 2, 2, "brick", T),
  p(-1, 8, -1, 1, 1, "slope", DT, 1),
  p(-1, 8, 0, 1, 1, "slope", DT, 1),

  // Ring band
  p(0, 11, -1, 2, 2, "plate", DB),
  p(0, 12, -1, 2, 2, "rbrick", T),

  // Step toward +z
  p(0, 15, 0, 2, 2, "brick", T),
  p(0, 15, -1, 1, 1, "slope", DT),
  p(1, 15, -1, 1, 1, "slope", DT),

  // Step toward +x
  p(1, 18, 0, 2, 2, "brick", T),
  p(0, 18, 0, 1, 1, "slope", DT, 1),
  p(0, 18, 1, 1, 1, "slope", DT, 1),

  // Ring band
  p(1, 21, 0, 2, 2, "plate", DB),
  p(1, 22, 0, 2, 2, "brick", T),

  // Diagonal step
  p(2, 25, 1, 2, 2, "brick", T),
  p(1, 25, 0, 1, 1, "slope", DT, 1),
  p(1, 25, 1, 1, 1, "slope", DT, 1),
  p(2, 25, 0, 1, 1, "slope", DT),

  // Thin out to one stud wide
  p(3, 28, 1, 1, 2, "brick", T),
  p(2, 28, 1, 1, 1, "slope", DT, 1),
  p(2, 28, 2, 1, 1, "slope", DT, 1),
  p(3, 31, 2, 1, 2, "brick", T),
  p(3, 31, 1, 1, 1, "cheese", DT, 2),

  // Tip
  p(3, 34, 2, 1, 1, "cheese", DT, 2),
  p(3, 34, 3, 1, 1, "rbrick", BLY),
  p(3, 37, 3, 1, 1, "cone", W),
];

/* ================================================================== */
/*  Crown — 6x6 gold band, jewelled rim, points and a center spire     */
/* ================================================================== */
const CROWN: PresetBrick[] = [
  // Velvet base
  p(-3, 0, -3, 2, 6, "plate", DG),
  p(-1, 0, -3, 2, 6, "plate", DG),
  p(1, 0, -3, 2, 6, "plate", DG),

  // Band footing + cushion
  p(-3, 1, -3, 1, 6, "plate", BLO, 1),
  p(-3, 1, 2, 1, 6, "plate", BLO, 1),
  p(-3, 1, -2, 1, 4, "plate", BLO),
  p(2, 1, -2, 1, 4, "plate", BLO),
  p(-2, 1, -2, 4, 4, "tile", K),

  // Gold band
  p(-3, 2, -3, 1, 2, "brick", Y, 1),
  p(-1, 2, -3, 1, 2, "brick", BLO, 1),
  p(1, 2, -3, 1, 2, "brick", Y, 1),
  p(-3, 2, 2, 1, 2, "brick", Y, 1),
  p(-1, 2, 2, 1, 2, "brick", BLO, 1),
  p(1, 2, 2, 1, 2, "brick", Y, 1),
  p(-3, 2, -2, 1, 2, "brick", BLO),
  p(-3, 2, 0, 1, 2, "brick", Y),
  p(2, 2, -2, 1, 2, "brick", BLO),
  p(2, 2, 0, 1, 2, "brick", Y),

  // Inner ledge + jewel column
  p(-2, 2, -2, 1, 4, "plate", DT, 1),
  p(-2, 2, 1, 1, 4, "plate", DT, 1),
  p(-2, 2, -1, 1, 2, "plate", DT),
  p(1, 2, -1, 1, 2, "plate", DT),
  p(-1, 2, -1, 2, 2, "rbrick", DR),

  // Upper rim
  p(-3, 5, -3, 1, 6, "plate", BLY, 1),
  p(-3, 5, 2, 1, 6, "plate", BLY, 1),
  p(-3, 5, -2, 1, 4, "plate", BLY),
  p(2, 5, -2, 1, 4, "plate", BLY),
  p(-1, 5, -1, 2, 2, "rplate", BLY),

  // Bridges tying the rim to the center spire
  p(-3, 6, 0, 1, 4, "plate", Y, 1),
  p(1, 6, 0, 1, 2, "plate", Y, 1),
  p(0, 6, -3, 1, 3, "plate", Y),
  p(0, 6, 1, 1, 2, "plate", Y),

  // Center spire
  p(0, 7, 0, 1, 1, "rplate", R),
  p(0, 8, 0, 1, 1, "cone", R),

  // Cardinal points
  p(-1, 6, -3, 1, 1, "brick", Y),
  p(-1, 9, -3, 1, 1, "cone", BLO),
  p(-1, 6, 2, 1, 1, "brick", Y),
  p(-1, 9, 2, 1, 1, "cone", BLO),
  p(-3, 6, -1, 1, 1, "brick", Y),
  p(-3, 9, -1, 1, 1, "cone", BLO),
  p(2, 6, -1, 1, 1, "brick", Y),
  p(2, 9, -1, 1, 1, "cone", BLO),

  // Corner fleurs (shorter than the cardinals)
  p(-3, 6, -3, 1, 1, "cone", BLY),
  p(2, 6, -3, 1, 1, "cone", BLY),
  p(-3, 6, 2, 1, 1, "cone", BLY),
  p(2, 6, 2, 1, 1, "cone", BLY),

  // Jewels set into the rim
  p(-2, 6, -3, 1, 1, "rplate", R),
  p(1, 6, -3, 1, 1, "rplate", BLU),
  p(-2, 6, 2, 1, 1, "rplate", BLU),
  p(1, 6, 2, 1, 1, "rplate", G),
  p(-3, 6, -2, 1, 1, "rplate", BLU),
  p(-3, 6, 1, 1, 1, "rplate", G),
  p(2, 6, -2, 1, 1, "rplate", G),
  p(2, 6, 1, 1, 1, "rplate", R),
];

/* ================================================================== */
/*  Key — laid flat on the plate: ring bow, channeled shaft, cut bit   */
/* ================================================================== */
const KEY: PresetBrick[] = [
  // Bow ring, hollow center
  p(-3, 0, -3, 1, 6, "plate", BLO, 1),
  p(-3, 0, 2, 1, 6, "plate", BLO, 1),
  p(-3, 0, -2, 1, 4, "plate", Y),
  p(2, 0, -2, 1, 4, "plate", Y),

  // Shaft
  p(3, 0, -1, 2, 8, "plate", Y, 1),

  // Bit and teeth
  p(11, 0, -1, 2, 2, "plate", BLO),
  p(13, 0, -1, 1, 2, "plate", BLO),
  p(14, 0, -1, 1, 2, "plate", BLY),
  p(11, 0, -3, 2, 2, "plate", Y),
  p(13, 0, -2, 1, 1, "plate", Y),

  // Raised faces
  p(-3, 1, -3, 1, 6, "tile", BLY, 1),
  p(-3, 1, 2, 1, 6, "tile", BLY, 1),
  p(-3, 1, -2, 1, 4, "tile", BLY),
  p(2, 1, -2, 1, 4, "tile", BLY),
  p(3, 1, -1, 1, 8, "tile", BLY, 1),
  p(3, 1, 0, 1, 8, "tile", DT, 1),
  p(11, 1, -1, 2, 2, "tile", BLY),
  p(13, 1, -1, 1, 2, "tile", DT),
  p(11, 1, -3, 2, 2, "tile", DT),
  p(13, 1, -2, 1, 1, "tile", DT),

  // Rounded bow corners
  p(-3, 2, -3, 1, 1, "rbrick", Y),
  p(2, 2, -3, 1, 1, "rbrick", Y),
  p(-3, 2, 2, 1, 1, "rbrick", Y),
  p(2, 2, 2, 1, 1, "rbrick", Y),

  // Bow gems
  p(-1, 2, -3, 1, 1, "rplate", R),
  p(0, 2, -3, 1, 1, "rplate", BLU),
  p(-1, 2, 2, 1, 1, "rplate", BLU),
  p(0, 2, 2, 1, 1, "rplate", R),
  p(-3, 2, -1, 1, 1, "rplate", G),
  p(-3, 2, 0, 1, 1, "rplate", G),
  p(2, 2, -1, 1, 1, "rplate", R),
  p(2, 2, 0, 1, 1, "rplate", R),

  // Bit point
  p(13, 2, -1, 1, 1, "cheese", Y, 1),
  p(13, 2, 0, 1, 1, "cheese", Y, 1),
];

export const PRESETS: Preset[] = [
  {
    id: "apple",
    name: "Apple",
    blurb: "A round purple fruit with a soft dome, stem, and green leaf.",
    accent: "#81007B",
    bricks: APPLE,
  },
  {
    id: "sword",
    name: "Sword",
    blurb: "Banded grip, twin crossguard, and a fullered blade.",
    accent: "#A0A5A9",
    bricks: SWORD,
  },
  {
    id: "horn",
    name: "Horn",
    blurb: "A stepped spiral horn that twists up to a pale tip.",
    accent: "#E4CD9E",
    bricks: HORN,
  },
  {
    id: "crown",
    name: "Crown",
    blurb: "Gold band with jewelled rim, tall points, and a spire.",
    accent: "#F8BB3D",
    bricks: CROWN,
  },
  {
    id: "key",
    name: "Key",
    blurb: "Laid flat: ring bow, channeled shaft, and a cut bit.",
    accent: "#F5C518",
    bricks: KEY,
  },
];

for (const preset of PRESETS) assertPresetValid(preset);
