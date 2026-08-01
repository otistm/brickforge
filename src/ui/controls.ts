import { COLORS } from "../config/colors";
import { SHAPE_KEYS, SHAPES } from "../config/shapes";
import { bricks, effSize, shapeDef, state, undoStack } from "../core/store";
import type { ShapeKey } from "../core/types";
import { addBrick, applyRotation, removeBrick } from "../engine/bricks";
import { hideGhost, resetGhostKey } from "../engine/ghost";
import { clearHighlight } from "../engine/highlight";
import { pieceSVG } from "../features/pieceSvg";
import { $id } from "./dom";

function updateSizeLabel(): void {
  const [w, d] = effSize();
  $id("sizeLabel").textContent = w + "×" + d + (state.rot ? " ↻" + state.rot * 90 + "°" : "");
}

/** Rotates the active build selection (the ghost). Shared by the button, R key and right-click. */
export function rotateSelection(): void {
  state.rot = (state.rot + 1) % 4;
  resetGhostKey();
  updateSizeLabel();
}

/** Activates the Build tool and syncs the tool-button UI. */
export function selectBuildTool(): void {
  state.tool = "build";
  $id("toolBuild").classList.add("on");
  $id("toolErase").classList.remove("on");
  clearHighlight();
}

/** Activates the Erase tool and syncs the tool-button UI. */
export function selectEraseTool(): void {
  state.tool = "erase";
  $id("toolErase").classList.add("on");
  $id("toolBuild").classList.remove("on");
  hideGhost();
}

function buildSizes(): void {
  const szEl = $id("sizes");
  szEl.innerHTML = "";
  shapeDef().sizes.forEach((s) => {
    const b = document.createElement("button");
    b.className = "sizebtn" + (s[0] === state.size[0] && s[1] === state.size[1] ? " on" : "");
    b.textContent = s[0] + "×" + s[1];
    b.onclick = () => {
      state.size = s;
      [...szEl.children].forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      resetGhostKey();
      updateSizeLabel();
    };
    szEl.appendChild(b);
  });
}

function buildSwatches(): void {
  const swEl = $id("swatches");
  swEl.innerHTML = "";
  COLORS.forEach((c, i) => {
    const d = document.createElement("div");
    d.className = "swatch" + (i === state.colorIdx ? " on" : "");
    d.style.background = c[1];
    d.title = c[0];
    d.onclick = () => {
      state.colorIdx = i;
      [...swEl.children].forEach((x) => x.classList.remove("on"));
      d.classList.add("on");
      resetGhostKey();
    };
    swEl.appendChild(d);
  });
}

function buildShapes(): void {
  const shEl = $id("shapes");
  shEl.innerHTML = "";
  SHAPE_KEYS.forEach((k) => {
    const S = SHAPES[k];
    const b = document.createElement("button");
    b.className = "shapebtn" + (k === state.shape ? " on" : "");
    b.dataset.k = k;
    b.innerHTML = `${pieceSVG(k, S.sizes[0][0], S.sizes[0][1], "#cfd3d6")}<span>${S.label}</span>`;
    b.onclick = () => {
      state.shape = k;
      [...shEl.children].forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      if (!S.sizes.some((s) => s[0] === state.size[0] && s[1] === state.size[1])) {
        state.size = S.sizes[Math.min(1, S.sizes.length - 1)];
      }
      state.rot = 0;
      resetGhostKey();
      buildSizes();
      updateSizeLabel();
    };
    shEl.appendChild(b);
  });
}

/** Selects a piece in the tool rail (used by scan inventory / "Use"). */
export function selectPiece(shape: ShapeKey, w: number, d: number, colorIdx?: number): void {
  state.shape = shape;
  const sizes = SHAPES[shape].sizes;
  const match = sizes.find((s) => s[0] === w && s[1] === d) ?? sizes.find((s) => s[0] === d && s[1] === w);
  state.size = match ? ([match[0], match[1]] as typeof state.size) : ([w, d] as typeof state.size);
  state.rot = 0;
  if (colorIdx != null && COLORS[colorIdx]) state.colorIdx = colorIdx;
  buildSwatches();
  buildShapes();
  buildSizes();
  updateSizeLabel();
  selectBuildTool();
  resetGhostKey();
}

export function initToolRail(): void {
  buildSwatches();
  buildShapes();
  buildSizes();
  updateSizeLabel();

  const tBuild = $id("toolBuild");
  const tErase = $id("toolErase");
  tBuild.onclick = selectBuildTool;
  tErase.onclick = selectEraseTool;

  $id("btnRotate").onclick = rotateSelection;

  $id("btnUndo").onclick = () => {
    const act = undoStack.pop();
    if (!act) return;
    if (act.type === "add") {
      const b = bricks.find((x) => x.id === act.id);
      if (b) removeBrick(b, false);
    } else if (act.type === "remove") {
      addBrick(act.data, false);
    } else if (act.type === "rotate") {
      const b = bricks.find((x) => x.id === act.id);
      if (b) applyRotation(b, act.fromRot, false);
    }
  };

  $id("btnClear").onclick = () => {
    if (!bricks.length) return;
    if (!confirm("Remove all " + bricks.length + " pieces?")) return;
    [...bricks].forEach((b) => removeBrick(b, false));
    undoStack.length = 0;
  };

  window.addEventListener("keydown", (e) => {
    if ((e.target as HTMLElement)?.tagName === "INPUT") return;
    if (e.key === "r" || e.key === "R") $id("btnRotate").click();
    else if (e.key === "b" || e.key === "B") tBuild.click();
    else if (e.key === "e" || e.key === "E") tErase.click();
    else if ((e.ctrlKey || e.metaKey) && e.key === "z") $id("btnUndo").click();
  });
}
