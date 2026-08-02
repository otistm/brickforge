import type { ShapeKey } from "../core/types";
import { COLORS } from "./colors";
import { ownedQty, PALETTE } from "./ownedParts";
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

const { W, LBG, DAZ, K, DR, DP, MG, PU, BLU, DG, G, Y, R, RB } = PALETTE;

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
 * baseplate or a piece below it. On top of that it checks the bill of materials
 * against the physical collection in `ownedParts`, so a preset can never ask
 * for a part — or more copies of a part — than the user actually has.
 * Throws on the first problem found.
 */
export function assertPresetValid(preset: Preset): void {
  const owners = new Map<string, PresetBrick>();
  const used = new Map<string, { b: PresetBrick; n: number }>();

  for (const b of preset.bricks) {
    const def = SHAPES[b.shape];
    if (!def.sizes.some(([w, d]) => w === b.w0 && d === b.d0)) {
      throw new Error(
        `Preset "${preset.id}": ${b.shape} has no ${b.w0}x${b.d0} size`
      );
    }
    const tally = `${b.shape}|${b.w0}x${b.d0}|${b.ci}`;
    const seen = used.get(tally);
    if (seen) seen.n++;
    else used.set(tally, { b, n: 1 });

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

  for (const { b, n } of used.values()) {
    const have = ownedQty(b.shape, b.w0, b.d0, b.ci);
    const part = `${COLORS[b.ci]?.[0] ?? b.ci} ${b.shape} ${b.w0}x${b.d0}`;
    if (have === 0) {
      throw new Error(`Preset "${preset.id}": ${part} is not in the collection`);
    }
    if (n > have) {
      throw new Error(`Preset "${preset.id}": needs ${n}x ${part}, only ${have} owned`);
    }
  }
}

/* ================================================================== */
/*  Apple — octagonal belly in dark pink, purple neck, stem and leaf   */
/* ================================================================== */

/**
 * A 6x6 course with all four corners cut back two studs, which is as round as
 * plain bricks get. Every piece reaches inward far enough to land on the
 * narrower course below it.
 */
function appleRing6(gy: number): PresetBrick[] {
  return [
    p(-2, gy, -3, 2, 4, "brick", DP, 1),
    p(-2, gy, 1, 2, 4, "brick", DP, 1),
    p(-3, gy, -1, 2, 2, "brick", DP),
    p(1, gy, -1, 2, 2, "brick", DP),
    p(-1, gy, -1, 2, 2, "brick", DP),
  ];
}

/** The same corner-cut trick one size up, for the two widest courses. */
function appleRing8(gy: number): PresetBrick[] {
  return [
    p(-3, gy, -4, 2, 4, "brick", DP, 1),
    p(1, gy, -4, 2, 2, "brick", DP),
    p(-3, gy, 2, 2, 4, "brick", DP, 1),
    p(1, gy, 2, 2, 2, "brick", DP),
    p(-4, gy, -2, 2, 4, "brick", DP),
    p(-2, gy, -2, 2, 4, "brick", DP),
    p(0, gy, -2, 2, 4, "brick", DP),
    p(2, gy, -2, 2, 4, "brick", DP),
  ];
}

const APPLE: PresetBrick[] = [
  // Foot — 4x4, so the fruit tucks in where it meets the board
  p(-2, 0, -2, 2, 4, "brick", DP),
  p(0, 0, -2, 2, 4, "brick", DP),

  // Belly — swells 6 wide, then 8 across the equator, then back to 6
  ...appleRing6(3),
  ...appleRing8(6),
  ...appleRing8(9),
  ...appleRing6(12),

  // Shoulder — roof tiles pull the last course in to the neck
  p(-1, 15, -3, 2, 2, "slope", MG),
  p(-1, 15, 1, 2, 2, "slope", MG, 2),
  p(-3, 15, -1, 2, 2, "slope", MG, 1),
  p(1, 15, -1, 2, 2, "slope", MG, 3),
  p(-1, 15, -1, 2, 2, "brick", DP),

  // Neck — purple, and the anchor both the stem and the leaf root into
  p(-1, 18, -1, 2, 2, "brick", PU),

  // Stem
  p(0, 21, 0, 1, 1, "brick", RB),
  p(0, 24, 0, 1, 1, "brick", RB),

  // Leaf — a curved slope tips the blade over
  p(-1, 21, -1, 1, 2, "brick", G),
  p(-1, 24, -1, 1, 2, "curve", DG),
];

/* ================================================================== */
/*  Sword — black stand, banded grip, wide guard, two-tone blade       */
/* ================================================================== */
/**
 * One blade course: white edges either side of a grey fuller. Four studs wide
 * while the 1x4s hold out, then the same span rebuilt from pairs of 1x2s once
 * the light grey 1x4s run out.
 */
function bladeCourse(gy: number, wide: boolean): PresetBrick[] {
  if (wide) {
    return [
      p(-2, gy, -1, 1, 4, "brick", W, 1),
      p(-2, gy, 0, 1, 4, "brick", LBG, 1),
      p(-2, gy, 1, 1, 4, "brick", W, 1),
    ];
  }
  return [
    p(-2, gy, -1, 1, 2, "brick", W, 1),
    p(0, gy, -1, 1, 2, "brick", W, 1),
    p(-2, gy, 0, 1, 2, "brick", LBG, 1),
    p(0, gy, 0, 1, 2, "brick", LBG, 1),
    p(-2, gy, 1, 1, 2, "brick", W, 1),
    p(0, gy, 1, 1, 2, "brick", W, 1),
  ];
}

const SWORD: PresetBrick[] = [
  // Pedestal — 6x6 of black, a dark red band, then a black riser
  p(-3, 0, -3, 2, 6, "brick", K, 1),
  p(-3, 0, -1, 2, 6, "brick", K, 1),
  p(-3, 0, 1, 2, 6, "brick", K, 1),
  p(-2, 3, -2, 2, 2, "brick", DR),
  p(0, 3, -2, 2, 2, "brick", DR),
  p(-2, 3, 0, 2, 2, "brick", DR),
  p(0, 3, 0, 2, 2, "brick", DR),
  p(-2, 6, -2, 2, 4, "brick", K),
  p(0, 6, -2, 2, 4, "brick", K),

  // Pommel and banded grip
  p(-1, 9, -1, 2, 2, "brick", Y),
  p(-1, 12, -1, 2, 2, "brick", RB),
  p(-1, 15, -1, 2, 2, "brick", K),
  p(-1, 18, -1, 2, 2, "brick", RB),
  p(-1, 21, -1, 2, 2, "brick", K),

  // Crossguard — two arms at right angles, capped in red at each quillon
  p(-3, 24, -1, 2, 6, "brick", Y, 1),
  p(-3, 27, -1, 1, 2, "brick", R),
  p(2, 27, -1, 1, 2, "brick", R),
  p(-1, 27, -3, 2, 6, "brick", Y),
  p(-1, 30, -3, 1, 2, "brick", R, 1),
  p(-1, 30, 2, 1, 2, "brick", R, 1),

  // Blade
  ...bladeCourse(30, true),
  ...bladeCourse(33, true),
  ...bladeCourse(36, true),
  ...bladeCourse(39, false),
  ...bladeCourse(42, false),
  ...bladeCourse(45, false),

  // Point — narrows to two studs, then one
  p(-1, 48, -1, 1, 2, "brick", W, 1),
  p(-1, 48, 0, 1, 2, "brick", LBG, 1),
  p(-1, 48, 1, 1, 2, "brick", W, 1),
  p(-1, 51, 0, 1, 2, "brick", W, 1),
  p(-1, 54, 0, 1, 1, "brick", W),
];

/* ================================================================== */
/*  Raygun — stands on its grip, barrel held level by a forward vane   */
/* ================================================================== */
const RAYGUN: PresetBrick[] = [
  // Power cell, foot and grip column
  p(-10, 0, -1, 2, 2, "brick", G),
  p(-8, 0, -1, 2, 4, "brick", K, 1),
  p(-10, 3, -1, 2, 2, "brick", G),
  p(-8, 3, -1, 2, 2, "brick", K),
  p(-6, 3, -1, 1, 2, "brick", K),
  p(-10, 6, -1, 2, 4, "brick", K, 1),
  p(-6, 6, -1, 1, 2, "brick", R),

  // Forward vane — the second foot that keeps the barrel level
  p(1, 0, -1, 2, 2, "brick", BLU),
  p(1, 3, -1, 2, 2, "brick", BLU),
  p(1, 6, -1, 2, 2, "brick", BLU),

  // Receiver deck, bridging grip to vane
  p(-10, 9, -1, 2, 6, "brick", BLU, 1),
  p(-4, 9, -1, 2, 6, "brick", BLU, 1),
  p(2, 9, -1, 2, 2, "brick", BLU),

  // Second course, reaching two studs further forward
  p(-10, 12, -1, 2, 4, "brick", BLU, 1),
  p(-6, 12, -1, 2, 4, "brick", BLU, 1),
  p(-2, 12, -1, 2, 4, "brick", BLU, 1),
  p(2, 12, -1, 2, 4, "brick", BLU, 1),

  // Third course carries the barrel out to a white muzzle
  p(-10, 15, -1, 2, 4, "brick", BLU, 1),
  p(-6, 15, -1, 2, 4, "brick", BLU, 1),
  p(-2, 15, -1, 2, 4, "brick", BLU, 1),
  p(2, 15, -1, 2, 2, "brick", BLU),
  p(4, 15, -1, 2, 4, "brick", W, 1),

  // Rear deck steps down to the barrel, coil rings, muzzle glow
  p(-10, 18, -1, 2, 4, "brick", BLU, 1),
  p(-6, 18, -1, 2, 2, "slope", BLU, 3),
  p(-1, 18, -1, 1, 2, "brick", Y),
  p(0, 18, -1, 1, 2, "brick", BLU),
  p(1, 18, -1, 1, 2, "brick", Y),
  p(6, 18, -1, 1, 2, "brick", R),
  p(7, 18, -1, 1, 2, "brick", R),

  // Swept tail and sight
  p(-10, 21, -1, 2, 2, "slope", BLU, 1),
  p(-8, 21, -1, 1, 2, "brick", LBG),
];

/* ================================================================== */
/*  Crown — hollow 6x6 gold band, raised points, jewelled tips         */
/* ================================================================== */

/** One course of the hollow 6x6 gold band: two side walls, two end walls. */
function goldRing(gy: number): PresetBrick[] {
  return [
    p(-3, gy, -3, 1, 4, "brick", Y),
    p(-3, gy, 1, 1, 2, "brick", Y),
    p(2, gy, -3, 1, 4, "brick", Y),
    p(2, gy, 1, 1, 2, "brick", Y),
    p(-2, gy, -3, 1, 4, "brick", Y, 1),
    p(-2, gy, 2, 1, 4, "brick", Y, 1),
  ];
}

const CROWN: PresetBrick[] = [
  ...goldRing(0),
  ...goldRing(3),

  // Points rising off the band — four corners plus four cardinals
  p(-3, 6, -3, 1, 1, "brick", Y),
  p(2, 6, -3, 1, 1, "brick", Y),
  p(-3, 6, 2, 1, 1, "brick", Y),
  p(2, 6, 2, 1, 1, "brick", Y),
  p(-1, 6, -3, 1, 1, "brick", Y),
  p(-1, 6, 2, 1, 1, "brick", Y),
  p(-3, 6, -1, 1, 1, "brick", Y),
  p(2, 6, -1, 1, 1, "brick", Y),

  // Jewelled corner tips
  p(-3, 9, -3, 1, 1, "brick", R),
  p(2, 9, -3, 1, 1, "brick", DAZ),
  p(-3, 9, 2, 1, 1, "brick", G),
  p(2, 9, 2, 1, 1, "brick", R),
];

/* ================================================================== */
/*  Key — laid flat on the plate: ring bow, long shaft, cut bit        */
/* ================================================================== */
const KEY: PresetBrick[] = [
  // Bow — the same hollow ring the crown uses, doubled up for depth
  ...goldRing(0),
  ...goldRing(3),

  // Shaft, running out from the bow along +x
  p(3, 0, -1, 2, 6, "brick", Y, 1),
  p(9, 0, -1, 2, 4, "brick", Y, 1),

  // Bit — a tooth dropping off the shaft, then the tip
  p(11, 0, -3, 2, 2, "brick", Y),
  p(13, 0, -1, 1, 2, "brick", Y),

  // Gems set into the bow
  p(-1, 6, -3, 1, 1, "brick", R),
  p(-1, 6, 2, 1, 1, "brick", DAZ),
  p(-3, 6, -1, 1, 1, "brick", R),
  p(2, 6, -1, 1, 1, "brick", DAZ),
];

export const PRESETS: Preset[] = [
  {
    id: "apple",
    name: "Apple",
    blurb: "A rounded pink fruit with a purple neck, brown stem, and green leaf.",
    accent: "#C870A0",
    bricks: APPLE,
  },
  {
    id: "sword",
    name: "Sword",
    blurb: "Stone plinth, banded grip, crossed guard, and a fullered blade.",
    accent: "#A0A5A9",
    bricks: SWORD,
  },
  {
    id: "raygun",
    name: "Raygun",
    blurb: "Stands on its grip: coil barrel, glowing muzzle, green power cell.",
    accent: "#0055BF",
    bricks: RAYGUN,
  },
  {
    id: "crown",
    name: "Crown",
    blurb: "Hollow gold band with eight points and jewelled corners.",
    accent: "#F2CD37",
    bricks: CROWN,
  },
  {
    id: "key",
    name: "Key",
    blurb: "Laid flat: ring bow, long shaft, and a cut bit.",
    accent: "#F2CD37",
    bricks: KEY,
  },
];

for (const preset of PRESETS) assertPresetValid(preset);
