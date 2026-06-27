import { bricks, view } from "../core/store";
import { hideGhost } from "../engine/ghost";
import { clearHighlight } from "../engine/highlight";
import { selectBuildTool } from "../ui/controls";
import { $id } from "../ui/dom";
import { frameToBuild } from "./serialize";

export function initDisplay(): void {
  $id("btnDisplay").onclick = () => {
    view.isDisplay = true;
    view.autoRotate = true;
    document.body.classList.add("display");
    hideGhost();
    clearHighlight();
    frameToBuild();
    $id("dispName").textContent = bricks.length ? "Your Creation" : "Empty Stage";
    $id("dispParts").textContent = bricks.length + " pieces";
  };

  $id("btnExit").onclick = () => {
    view.isDisplay = false;
    view.autoRotate = false;
    document.body.classList.remove("display");
    // "Back to building" should always drop you into the Build tool.
    selectBuildTool();
  };
}
