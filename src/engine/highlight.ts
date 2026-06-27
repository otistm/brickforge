import * as THREE from "three";
import type { Brick } from "../core/types";
import { ndc, pickList, raycaster } from "./placement";
import { camera, renderer } from "./scene";

let highlighted: Brick | null = null;

export function clearHighlight(): void {
  if (highlighted) {
    const m = highlighted.mesh.material as THREE.MeshStandardMaterial;
    if (m.emissive) m.emissive.setHex(0x000000);
    highlighted = null;
  }
}

export function highlightAt(cx: number, cy: number): void {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.x = ((cx - r.left) / r.width) * 2 - 1;
  ndc.y = -((cy - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(pickList, false);
  if (hits.length) {
    const b = hits[0].object.userData.brick as Brick;
    highlighted = b;
    if (!b.mesh.userData._cloned) {
      b.mesh.material = (b.mesh.material as THREE.MeshStandardMaterial).clone();
      b.mesh.userData._cloned = true;
    }
    const m = b.mesh.material as THREE.MeshStandardMaterial;
    m.emissive = new THREE.Color(0xe0484b);
    m.emissiveIntensity = 0.6;
  }
}
