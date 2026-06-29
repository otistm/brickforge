import "./styles/index.css";

import { onInventoryChange } from "./core/store";
import { applyCamera, initControls, setFlashHint, setRotateSelection } from "./engine/cameraControls";
import { resize, startLoop } from "./engine/loop";
import { initBooklet } from "./features/booklet";
import { initDisplay } from "./features/display";
import { refreshInventory } from "./features/inventory";
import { decode, loadData } from "./features/serialize";
import { initShareIo } from "./features/shareIo";
import { initToolRail, rotateSelection } from "./ui/controls";
import { flashHint } from "./ui/toast";
import { initMobileTabs } from "./ui/mobileTabs";
import { initTheme } from "./ui/theme";

// Wire cross-layer hooks (avoids engine -> feature/ui import cycles).
onInventoryChange(refreshInventory);
setFlashHint(flashHint);
setRotateSelection(rotateSelection);

// UI + feature wiring.
initTheme();
initToolRail();
initShareIo();
initDisplay();
initMobileTabs();
initBooklet();

// Pointer/keyboard input + render loop.
initControls();
window.addEventListener("resize", resize);
resize();
applyCamera();
startLoop();

// Load a build from a share link, if present.
const shared = location.hash.match(/b=([^&]+)/);
if (shared) {
  try {
    loadData(decode(shared[1]));
  } catch (e) {
    console.warn("bad share data", e);
  }
}
