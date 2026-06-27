import * as THREE from "three";
import { HALF, STUD } from "../config/constants";
import { effSize, shapeDef } from "../core/store";
import type { Brick, Placement } from "../core/types";
import { baseBox, camera, renderer } from "./scene";

export const raycaster = new THREE.Raycaster();
export const ndc = new THREE.Vector2();
/** Meshes eligible for raycasting (placement + erase). */
export const pickList: THREE.Mesh[] = [];

export function screenToPlacement(clientX: number, clientY: number): Placement | null {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.x = ((clientX - r.left) / r.width) * 2 - 1;
  ndc.y = -((clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects([baseBox, ...pickList], false);
  const [w, d] = effSize();
  for (const hit of hits) {
    if (!hit.face) continue;
    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    if (n.y > 0.85) {
      // flat top only -> avoids placing onto slope faces
      let supportLayer: number;
      if (hit.object === baseBox) {
        supportLayer = 0;
      } else {
        const b = hit.object.userData.brick as Brick;
        supportLayer = b.gy + b.h;
      }
      const p = hit.point;
      let gx = Math.round(p.x / STUD - w / 2);
      let gz = Math.round(p.z / STUD - d / 2);
      gx = Math.max(-HALF, Math.min(HALF - w, gx));
      gz = Math.max(-HALF, Math.min(HALF - d, gz));
      return { gx, gy: supportLayer, gz, w, d, h: shapeDef().h };
    }
  }
  return null;
}

export function brickAt(cx: number, cy: number): Brick | null {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.x = ((cx - r.left) / r.width) * 2 - 1;
  ndc.y = -((cy - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(pickList, false);
  return hits.length ? (hits[0].object.userData.brick as Brick) : null;
}
