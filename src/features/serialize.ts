import { PLATE } from "../config/constants";
import { SHAPE_KEYS } from "../config/shapes";
import { bricks, undoStack } from "../core/store";
import type { SerializedBrick, ShapeKey } from "../core/types";
import { addBrick, removeBrick } from "../engine/bricks";
import { applyCamera, cam } from "../engine/cameraControls";
import { baseW } from "../engine/scene";

export function serialize(): SerializedBrick[] {
  return bricks.map((b) => [
    b.gx, b.gy, b.gz, b.w0, b.d0, SHAPE_KEYS.indexOf(b.shape), b.ci, b.rot,
  ]);
}

export function frameToBuild(): void {
  let maxY = 0;
  for (const b of bricks) maxY = Math.max(maxY, b.gy + b.h);
  cam.target.set(0, maxY * PLATE * 0.4, 0);
  cam.radius = Math.max(180, baseW * 0.95);
  applyCamera();
}

export function loadData(arr: number[][]): void {
  [...bricks].forEach((b) => removeBrick(b, false));
  undoStack.length = 0;
  for (const a of arr) {
    const shape: ShapeKey = SHAPE_KEYS[a[5]] || "brick";
    addBrick(
      { gx: a[0], gy: a[1], gz: a[2], w0: a[3], d0: a[4], shape, ci: a[6], rot: a[7] || 0 },
      false
    );
  }
  if (bricks.length) frameToBuild();
}

export function encode(): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(serialize()))));
}

export function decode(s: string): number[][] {
  return JSON.parse(decodeURIComponent(escape(atob(s))));
}
