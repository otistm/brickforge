import { COLORS } from "../config/colors";
import { SHAPE_KEYS, SHAPES } from "../config/shapes";
import { FEE_WAIVER, money, SERVICE_FEE, unitCents } from "../config/pricing";
import { blColorId, brickLinkSearchUrl, brickLinkUrl, lookupPart } from "../config/partMap";
import { bricks } from "../core/store";
import type { Brick, ShapeKey } from "../core/types";
import { $id } from "../ui/dom";
import { pieceSVG } from "./pieceSvg";

export interface PartGroup {
  ci: number;
  shape: ShapeKey;
  size: string;
  label: string;
  w0: number;
  d0: number;
  count: number;
}

export function partLabel(b: Brick): { size: string; label: string } {
  const a = Math.min(b.w0, b.d0);
  const c = Math.max(b.w0, b.d0);
  return { size: a + "×" + c, label: SHAPES[b.shape].label };
}

/** Buckets bricks by color + shape + size, sorted booklet-style. */
export function groupBricks(list: Brick[]): PartGroup[] {
  const groups = new Map<string, PartGroup>();
  for (const b of list) {
    const { size, label } = partLabel(b);
    const key = b.ci + "|" + b.shape + "|" + size;
    if (!groups.has(key)) {
      groups.set(key, { ci: b.ci, shape: b.shape, size, label, w0: b.w0, d0: b.d0, count: 0 });
    }
    groups.get(key)!.count++;
  }
  return [...groups.values()].sort(
    (a, b) =>
      a.ci - b.ci ||
      SHAPE_KEYS.indexOf(a.shape) - SHAPE_KEYS.indexOf(b.shape) ||
      a.size.localeCompare(b.size)
  );
}

export function refreshInventory(): void {
  const list = $id("invList");
  const total = $id("invTotal");
  const costBar = $id("invCost");
  if (bricks.length === 0) {
    list.innerHTML =
      '<div class="inv-empty">Place your first piece.<br>Every brick, slope, and arch you use shows up here as a tidy buy-list — priced like LEGO® Pick a Brick, sorted like a real instruction booklet.</div>';
    total.textContent = "Your shopping list builds itself as you go.";
    costBar.classList.remove("show");
    return;
  }
  const arr = groupBricks(bricks);
  let grand = 0;
  list.innerHTML = arr
    .map((g) => {
      const [nm, hex] = COLORS[g.ci];
      const unit = unitCents(g.shape, g.w0, g.d0);
      const line = unit * g.count;
      grand += line;
      const part = lookupPart(g.shape, g.w0, g.d0);
      const href = part
        ? brickLinkUrl(part, blColorId(g.ci))
        : brickLinkSearchUrl(`${g.size} ${g.label} ${nm}`);
      const partTxt = part ? ` · #${part}` : "";
      return `<div class="part"><a class="pic lnk" href="${href}" target="_blank" rel="noopener" title="${
        part ? "View part #" + part + " on BrickLink" : "Search on BrickLink"
      }">${pieceSVG(g.shape, g.w0, g.d0, hex)}</a>
      <div class="meta"><div class="nm">${g.size} ${g.label}</div><div class="cl">${nm}${partTxt} · ${money(unit)} ea</div></div>
      <div class="ct"><span class="ctn">${g.count}<i> ×</i></span><span class="sub">${money(line)}</span></div></div>`;
    })
    .join("");
  const distinct = arr.length;
  total.textContent = `${bricks.length} pieces · ${distinct} unique part${distinct > 1 ? "s" : ""}`;
  // Pick a Brick service-fee logic
  const waived = grand >= FEE_WAIVER;
  const fee = waived ? 0 : SERVICE_FEE;
  $id("bdSub").textContent = money(grand);
  const feeRow = $id("bdFeeRow");
  const feeEl = $id("bdFee");
  feeRow.classList.toggle("waived", waived);
  feeEl.innerHTML = waived ? '<span class="bd-fee-strike">$7.00</span> Free' : money(SERVICE_FEE);
  $id("bdTotal").textContent = money(grand + fee);
  const note = $id("bdNote");
  note.innerHTML =
    (waived
      ? "Service fee waived — parts are over $14.00."
      : `Add <b>${money(FEE_WAIVER - grand)}</b> more in parts to waive the $7.00 service fee.`) +
    '<br><span class="bd-src">Price modeled on LEGO® Pick a Brick · part #s from BrickLink · excl. shipping &amp; tax</span>';
  costBar.classList.add("show");
}
