import { COLORS } from "../config/colors";
import { HALF, PLATE, STUD } from "../config/constants";
import { SHAPES } from "../config/shapes";
import { bricks, notifyChange, occupied, takeId, undoStack } from "../core/store";
import type { AddBrickOptions, Brick, Placement } from "../core/types";
import { makeBrick } from "./pieceFactory";
import { pickList } from "./placement";
import { scene } from "./scene";

export function cellsOf(gx: number, gy: number, gz: number, w: number, d: number, h: number): string[] {
  const o: string[] = [];
  for (let x = gx; x < gx + w; x++)
    for (let z = gz; z < gz + d; z++)
      for (let y = gy; y < gy + h; y++) o.push(x + "," + y + "," + z);
  return o;
}

export function isValid(pl: Placement | null): boolean {
  if (!pl) return false;
  const { gx, gy, gz, w, d, h } = pl;
  if (gx < -HALF || gz < -HALF || gx + w > HALF || gz + d > HALF) return false;
  for (const c of cellsOf(gx, gy, gz, w, d, h)) if (occupied.has(c)) return false;
  if (gy === 0) return true;
  for (let x = gx; x < gx + w; x++)
    for (let z = gz; z < gz + d; z++)
      if (occupied.has(x + "," + (gy - 1) + "," + z)) return true;
  return false;
}

export function addBrick(opt: AddBrickOptions, record = true): Brick {
  const S = SHAPES[opt.shape];
  const h = S.h;
  const ew = opt.rot % 2 ? opt.d0 : opt.w0;
  const ed = opt.rot % 2 ? opt.w0 : opt.d0;
  const hex = COLORS[opt.ci][1];
  const { group, mesh } = makeBrick(opt.shape, opt.w0, opt.d0, hex);
  group.position.set((opt.gx + ew / 2) * STUD, opt.gy * PLATE, (opt.gz + ed / 2) * STUD);
  group.rotation.y = (opt.rot % 4) * Math.PI / 2;
  scene.add(group);
  const brick: Brick = {
    id: takeId(),
    gx: opt.gx, gy: opt.gy, gz: opt.gz,
    w0: opt.w0, d0: opt.d0, ew, ed, h,
    shape: opt.shape, ci: opt.ci, rot: opt.rot,
    group, mesh,
  };
  mesh.userData.brick = brick;
  bricks.push(brick);
  pickList.push(mesh);
  for (const c of cellsOf(opt.gx, opt.gy, opt.gz, ew, ed, h)) occupied.set(c, brick.id);
  if (record) undoStack.push({ type: "add", id: brick.id });
  notifyChange();
  return brick;
}

/**
 * Rotates a placed brick to an absolute orientation in place (same origin),
 * validating against the grid. Returns false (and leaves the brick untouched)
 * when the rotated footprint won't fit.
 */
export function applyRotation(brick: Brick, newRot: number, record = true): boolean {
  const rot = ((newRot % 4) + 4) % 4;
  const ew = rot % 2 ? brick.d0 : brick.w0;
  const ed = rot % 2 ? brick.w0 : brick.d0;
  // Free the brick's own cells first so it doesn't collide with itself.
  for (const c of cellsOf(brick.gx, brick.gy, brick.gz, brick.ew, brick.ed, brick.h)) occupied.delete(c);
  const fits = isValid({ gx: brick.gx, gy: brick.gy, gz: brick.gz, w: ew, d: ed, h: brick.h });
  if (!fits) {
    for (const c of cellsOf(brick.gx, brick.gy, brick.gz, brick.ew, brick.ed, brick.h)) occupied.set(c, brick.id);
    return false;
  }
  const fromRot = brick.rot;
  brick.rot = rot;
  brick.ew = ew;
  brick.ed = ed;
  brick.group.position.set((brick.gx + ew / 2) * STUD, brick.gy * PLATE, (brick.gz + ed / 2) * STUD);
  brick.group.rotation.y = rot * Math.PI / 2;
  for (const c of cellsOf(brick.gx, brick.gy, brick.gz, ew, ed, brick.h)) occupied.set(c, brick.id);
  if (record) undoStack.push({ type: "rotate", id: brick.id, fromRot });
  notifyChange();
  return true;
}

/** Rotates a placed brick by +90deg. Returns false when it won't fit. */
export function rotateBrick(brick: Brick, record = true): boolean {
  return applyRotation(brick, brick.rot + 1, record);
}

export function removeBrick(brick: Brick, record = true): void {
  const idx = bricks.indexOf(brick);
  if (idx < 0) return;
  scene.remove(brick.group);
  bricks.splice(idx, 1);
  const pi = pickList.indexOf(brick.mesh);
  if (pi >= 0) pickList.splice(pi, 1);
  for (const c of cellsOf(brick.gx, brick.gy, brick.gz, brick.ew, brick.ed, brick.h)) occupied.delete(c);
  if (record) {
    undoStack.push({
      type: "remove",
      data: {
        gx: brick.gx, gy: brick.gy, gz: brick.gz,
        w0: brick.w0, d0: brick.d0,
        shape: brick.shape, ci: brick.ci, rot: brick.rot,
      },
    });
  }
  notifyChange();
}
