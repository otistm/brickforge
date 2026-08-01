import { PRESETS, type Preset } from "../config/presets";
import { SHAPE_KEYS } from "../config/shapes";
import { bricks } from "../core/store";
import { $id } from "../ui/dom";
import { toast } from "../ui/toast";
import { loadData } from "./serialize";

function toSerialized(preset: Preset): number[][] {
  return preset.bricks.map((b) => [
    b.gx,
    b.gy,
    b.gz,
    b.w0,
    b.d0,
    SHAPE_KEYS.indexOf(b.shape),
    b.ci,
    b.rot ?? 0,
  ]);
}

function placePreset(preset: Preset): void {
  if (bricks.length) {
    const ok = confirm(
      `Replace the current build (${bricks.length} pieces) with “${preset.name}”?`
    );
    if (!ok) return;
  }
  loadData(toSerialized(preset));
  toast(`${preset.name} preset loaded`);
  closePanel();
}

function openPanel(): void {
  $id("presets").classList.add("open");
  $id("presets").setAttribute("aria-hidden", "false");
  $id("toolrail").classList.remove("open");
  $id("inv").classList.remove("open");
}

function closePanel(): void {
  $id("presets").classList.remove("open");
  $id("presets").setAttribute("aria-hidden", "true");
}

function renderCards(): void {
  const list = $id("presetList");
  list.innerHTML = PRESETS.map(
    (p) => `<button type="button" class="preset-card" data-id="${p.id}">
      <span class="preset-swatch" style="--preset-accent:${p.accent}"></span>
      <span class="preset-meta">
        <span class="preset-name">${p.name}</span>
        <span class="preset-blurb">${p.blurb}</span>
        <span class="preset-count">${p.bricks.length} pieces</span>
      </span>
      <span class="preset-go">Place</span>
    </button>`
  ).join("");
}

export function initPresets(): void {
  renderCards();

  $id("btnPresets").onclick = () => {
    if ($id("presets").classList.contains("open")) closePanel();
    else openPanel();
  };
  $id("btnPresetsClose").onclick = () => closePanel();

  $id("presetList").onclick = (e) => {
    const card = (e.target as HTMLElement).closest(".preset-card") as HTMLElement | null;
    if (!card) return;
    const preset = PRESETS.find((p) => p.id === card.dataset.id);
    if (preset) placePreset(preset);
  };

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $id("presets").classList.contains("open")) closePanel();
  });
}
