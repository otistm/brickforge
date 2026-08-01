import * as THREE from "three";
import { COLORS } from "../config/colors";
import { PLATE, STUD } from "../config/constants";
import { state } from "../core/store";
import { isValid } from "./bricks";
import { clearHighlight, highlightAt } from "./highlight";
import { eachMaterial, makeBrick } from "./pieceFactory";
import { screenToPlacement } from "./placement";
import { scene } from "./scene";

let ghost: THREE.Group | null = null;
let ghostKey = "";

/** Forces the ghost to rebuild on next update (color/shape/size/rot change). */
export function resetGhostKey(): void {
  ghostKey = "";
}

export function hideGhost(): void {
  if (ghost) ghost.visible = false;
}

export function isGhostVisible(): boolean {
  return ghost ? ghost.visible : false;
}

export function setGhostVisible(v: boolean): void {
  if (ghost) ghost.visible = v;
}

function buildGhost(): void {
  const [w0, d0] = state.size;
  const key = state.shape + w0 + "x" + d0 + "x" + state.colorIdx;
  if (key === ghostKey && ghost) return;
  ghostKey = key;
  if (ghost) scene.remove(ghost);
  const { group } = makeBrick(state.shape, w0, d0, COLORS[state.colorIdx][1]);
  // Clone materials so tweaking opacity/color doesn't mutate the shared cache.
  group.traverse((o) => {
    if (o.userData.isOutline || o.userData.isEdgeLines || o.userData.isStudHighlight) {
      const om = o as THREE.Mesh;
      const mat = (om.material as THREE.Material).clone();
      mat.transparent = true;
      mat.opacity = 0.35;
      om.material = mat;
      return;
    }
    const mesh = o as THREE.Mesh;
    const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshToonMaterial | undefined;
    if (mat && "color" in mat) {
      const cloned = mat.clone();
      cloned.transparent = true;
      cloned.opacity = 0.55;
      mesh.material = cloned;
      mesh.castShadow = false;
    }
  });
  ghost = group;
  ghost.visible = false;
  scene.add(ghost);
}

export function updateGhost(clientX: number, clientY: number): void {
  if (state.tool !== "build") {
    if (ghost) ghost.visible = false;
    clearHighlight();
    highlightAt(clientX, clientY);
    return;
  }
  buildGhost();
  const [w0, d0] = state.size;
  const ew = state.rot % 2 ? d0 : w0;
  const ed = state.rot % 2 ? w0 : d0;
  const pl = screenToPlacement(clientX, clientY);
  if (!pl || !ghost) {
    if (ghost) ghost.visible = false;
    return;
  }
  ghost.visible = true;
  ghost.position.set((pl.gx + ew / 2) * STUD, pl.gy * PLATE, (pl.gz + ed / 2) * STUD);
  ghost.rotation.y = (state.rot % 4) * Math.PI / 2;
  const ok = isValid(pl);
  const col = ok ? new THREE.Color(COLORS[state.colorIdx][1]) : new THREE.Color(0xe0484b);
  eachMaterial(ghost, (mat) => {
    mat.color.copy(col);
    mat.opacity = ok ? 0.55 : 0.4;
  });
}
