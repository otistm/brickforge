import { $id } from "./dom";

export function initMobileTabs(): void {
  $id("tabBricks").onclick = () => {
    $id("inv").classList.remove("open");
    $id("toolrail").classList.toggle("open");
  };
  $id("tabParts").onclick = () => {
    $id("toolrail").classList.remove("open");
    $id("inv").classList.toggle("open");
  };
}
