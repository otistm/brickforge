import { $id } from "./dom";

function closeAll(): void {
  $id("toolrail").classList.remove("open");
  $id("inv").classList.remove("open");
  $id("presets").classList.remove("open");
  $id("presets").setAttribute("aria-hidden", "true");
}

export function initMobileTabs(): void {
  $id("tabBricks").onclick = () => {
    const next = !$id("toolrail").classList.contains("open");
    closeAll();
    if (next) $id("toolrail").classList.add("open");
  };
  $id("tabParts").onclick = () => {
    const next = !$id("inv").classList.contains("open");
    closeAll();
    if (next) $id("inv").classList.add("open");
  };
  $id("tabPresets").onclick = () => {
    const next = !$id("presets").classList.contains("open");
    closeAll();
    if (next) {
      $id("presets").classList.add("open");
      $id("presets").setAttribute("aria-hidden", "false");
    }
  };
}
