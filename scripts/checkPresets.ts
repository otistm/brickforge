/**
 * Standalone runner for the preset validator, invoked by `npm run check:presets`.
 * `assertPresetValid` executes at import time, so simply loading the module
 * proves every preset is legal, in stock, and free of floating or overlapping
 * pieces. The printed bill of materials is there to eyeball against the real bin.
 */
import { COLORS } from "../src/config/colors";
import { ownedQty } from "../src/config/ownedParts";
import { PRESETS } from "../src/config/presets";
import { SHAPES } from "../src/config/shapes";

for (const preset of PRESETS) {
  const tally = new Map<string, number>();
  let top = 0;
  for (const b of preset.bricks) {
    const label = `${COLORS[b.ci]?.[0]} ${b.shape} ${b.w0}x${b.d0}`;
    tally.set(label, (tally.get(label) ?? 0) + 1);
    top = Math.max(top, b.gy + SHAPES[b.shape].h);
  }
  console.log(`\n${preset.name} — ${preset.bricks.length} pieces, ${top} plates tall`);
  for (const [label, n] of [...tally].sort()) {
    const b = preset.bricks.find(
      (x) => `${COLORS[x.ci]?.[0]} ${x.shape} ${x.w0}x${x.d0}` === label
    )!;
    const have = ownedQty(b.shape, b.w0, b.d0, b.ci);
    console.log(`   ${String(n).padStart(3)}x ${label.padEnd(32)} (own ${have})`);
  }
}
console.log("\nAll presets valid.");
