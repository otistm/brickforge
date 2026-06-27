import type { ShapeKey } from "../core/types";

/**
 * Per-piece estimate modeled on LEGO Pick a Brick (USD cents).
 * Calibrated to LEGO's published range: floor ~$0.03/piece, common bricks ~$0.10-0.15
 * (LEGO set avg price-per-piece runs ~$0.11-0.13). Real PaB prices vary by color and
 * change monthly, so this is an estimate, not a live feed.
 *
 * Each entry is [base cents, cents-per-stud].
 */
export const PRICE: Record<ShapeKey, [number, number]> = {
  brick: [4, 1.4], plate: [2, 0.9], tile: [3, 1.0], jumper: [3, 1.0],
  slope: [6, 1.8], islope: [6, 1.8], cheese: [3, 1.0], curve: [5, 1.4],
  rbrick: [5, 1.6], rplate: [4, 1.2], cone: [7, 1.8], arch: [12, 2.6],
};

/** LEGO Pick a Brick service fee, USD cents. */
export const SERVICE_FEE = 700;
/** Waived once a category's parts reach this minimum, USD cents. */
export const FEE_WAIVER = 1400;

export function unitCents(shape: ShapeKey, w: number, d: number): number {
  const p = PRICE[shape] || [4, 1.4];
  return Math.max(3, Math.round(p[0] + p[1] * (w * d)));
}

export function money(cents: number): string {
  return "$" + (cents / 100).toFixed(2);
}
