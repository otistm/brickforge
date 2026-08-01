import * as THREE from "three";
import type { Brick } from "../core/types";
import { ndc, pickList, raycaster } from "./placement";
import { camera, renderer } from "./scene";

let highlighted: Brick | null = null;

function meshColor(mesh: THREE.Mesh): THREE.Color | null {
  const m = mesh.material as THREE.MeshStandardMaterial | THREE.MeshToonMaterial | undefined;
  return m && "color" in m ? m.color : null;
}

export function clearHighlight(): void {
  if (!highlighted) return;
  const col = meshColor(highlighted.mesh);
  const saved = highlighted.mesh.userData._hlColor as THREE.Color | undefined;
  if (col && saved) col.copy(saved);
  const m = highlighted.mesh.material as THREE.MeshStandardMaterial;
  if (m.emissive) m.emissive.setHex(0x000000);
  highlighted = null;
}

export function highlightAt(cx: number, cy: number): void {
  clearHighlight();
  const r = renderer.domElement.getBoundingClientRect();
  ndc.x = ((cx - r.left) / r.width) * 2 - 1;
  ndc.y = -((cy - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(pickList, false);
  if (!hits.length) return;
  const b = hits[0]!.object.userData.brick as Brick;
  highlighted = b;
  if (!b.mesh.userData._cloned) {
    b.mesh.material = (b.mesh.material as THREE.Material).clone();
    b.mesh.userData._cloned = true;
  }
  const col = meshColor(b.mesh);
  if (col) {
    if (!b.mesh.userData._hlColor) b.mesh.userData._hlColor = col.clone();
    col.copy(b.mesh.userData._hlColor as THREE.Color).lerp(new THREE.Color(0xe0484b), 0.55);
  }
  const m = b.mesh.material as THREE.MeshStandardMaterial;
  if ("emissive" in m && m.emissive) {
    m.emissive = new THREE.Color(0xe0484b);
    m.emissiveIntensity = 0.45;
  }
}
