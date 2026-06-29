import * as THREE from "three";
import { state, view } from "../core/store";
import { toast } from "../ui/toast";
import { addBrick, isValid, removeBrick, rotateBrick } from "./bricks";
import { hideGhost, updateGhost } from "./ghost";
import { brickAt, screenToPlacement } from "./placement";
import { camera, cvs } from "./scene";

export const cam = {
  theta: 0.82,
  phi: 1.06,
  radius: 480,
  target: new THREE.Vector3(0, -28, 0),
};

export function applyCamera(): void {
  const sp = Math.sin(cam.phi);
  const cp = Math.cos(cam.phi);
  camera.position.set(
    cam.target.x + cam.radius * sp * Math.sin(cam.theta),
    cam.target.y + cam.radius * cp,
    cam.target.z + cam.radius * sp * Math.cos(cam.theta)
  );
  camera.lookAt(cam.target);
}

export function panCamera(dx: number, dy: number): void {
  const factor = cam.radius * 0.0016;
  const fwd = new THREE.Vector3();
  camera.getWorldDirection(fwd);
  const r = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
  const u = new THREE.Vector3().crossVectors(r, fwd).normalize();
  cam.target.addScaledVector(r, -dx * factor);
  cam.target.addScaledVector(u, dy * factor);
  applyCamera();
}

export function clampCam(): void {
  cam.phi = Math.max(0.12, Math.min(Math.PI * 0.495, cam.phi));
  // Cap zoom-out so the orbiting camera stays inside the room walls.
  cam.radius = Math.max(70, Math.min(720, cam.radius));
}

interface PointerInfo {
  x: number;
  y: number;
  button: number;
}

const pointers = new Map<number, PointerInfo>();
let downInfo: { x: number; y: number; t: number; button: number } | null = null;
let didDrag = false;
let pinchDist = 0;
let pinchMid: { x: number; y: number } | null = null;
const TAP_MOVE = 7;
const TAP_TIME = 350;

function handleTap(cx: number, cy: number): void {
  if (state.tool === "build") {
    const pl = screenToPlacement(cx, cy);
    if (pl && isValid(pl)) {
      addBrick({
        gx: pl.gx, gy: pl.gy, gz: pl.gz,
        w0: state.size[0], d0: state.size[1],
        shape: state.shape, ci: state.colorIdx, rot: state.rot,
      });
      flashHintHook?.();
    } else {
      toast("Can't place there — needs a flat surface beneath it");
    }
    updateGhost(cx, cy);
  } else {
    const b = brickAt(cx, cy);
    if (b) removeBrick(b);
  }
}

/**
 * flashHint lives in the UI layer; main.ts injects it to avoid an
 * engine -> ui hard dependency for the build feedback nudge.
 */
let flashHintHook: (() => void) | null = null;
export function setFlashHint(fn: () => void): void {
  flashHintHook = fn;
}

/** Rotating the active build selection lives in the UI layer; injected by main.ts. */
let rotateSelectionHook: (() => void) | null = null;
export function setRotateSelection(fn: () => void): void {
  rotateSelectionHook = fn;
}

/**
 * Right-click rotates: a placed brick under the cursor spins in place, while
 * empty space rotates the piece you're about to place (a mouse alternative to R).
 */
function handleRightClick(cx: number, cy: number): void {
  const b = brickAt(cx, cy);
  if (b) {
    if (!rotateBrick(b)) toast("Can't rotate that piece — no room to turn");
  } else {
    rotateSelectionHook?.();
  }
  if (!view.isDisplay) updateGhost(cx, cy);
}

function endPointer(e: PointerEvent): void {
  const wasSingle = pointers.size === 1;
  const di = downInfo;
  pointers.delete(e.pointerId);
  try {
    cvs.releasePointerCapture(e.pointerId);
  } catch {
    /* pointer already released */
  }
  if (pointers.size < 2) pinchDist = 0;
  if (wasSingle && di && !didDrag && !view.isDisplay) {
    const dt = Date.now() - di.t;
    if (dt < TAP_TIME) {
      if (di.button === 2) handleRightClick(e.clientX, e.clientY);
      else handleTap(e.clientX, e.clientY);
    }
  }
  downInfo = null;
  didDrag = false;
  if (pointers.size === 0 && !view.isDisplay) updateGhost(e.clientX, e.clientY);
}

export function initControls(): void {
  cvs.addEventListener("pointerdown", (e) => {
    cvs.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, button: e.button });
    if (pointers.size === 1) {
      downInfo = { x: e.clientX, y: e.clientY, t: Date.now(), button: e.button };
      didDrag = false;
    } else if (pointers.size === 2) {
      const p = [...pointers.values()];
      pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      pinchMid = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
      hideGhost();
    }
  });

  cvs.addEventListener("pointermove", (e) => {
    if (pointers.has(e.pointerId)) {
      const prev = pointers.get(e.pointerId)!;
      if (pointers.size === 1) {
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;
        if (downInfo && (Math.abs(e.clientX - downInfo.x) > TAP_MOVE || Math.abs(e.clientY - downInfo.y) > TAP_MOVE)) {
          didDrag = true;
        }
        if (didDrag) {
          if (downInfo && (downInfo.button === 2 || downInfo.button === 1)) {
            panCamera(dx, dy);
          } else {
            cam.theta -= dx * 0.006;
            cam.phi -= dy * 0.006;
            clampCam();
            applyCamera();
          }
          hideGhost();
        }
      } else if (pointers.size === 2) {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, button: prev.button });
        const p = [...pointers.values()];
        const dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        const mid = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
        if (pinchDist) {
          cam.radius *= pinchDist / dist;
          clampCam();
          applyCamera();
        }
        if (pinchMid) panCamera(mid.x - pinchMid.x, mid.y - pinchMid.y);
        pinchDist = dist;
        pinchMid = mid;
        didDrag = true;
        return;
      }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, button: prev.button });
    } else if (!view.isDisplay) {
      updateGhost(e.clientX, e.clientY);
    }
  });

  cvs.addEventListener("pointerup", endPointer);
  cvs.addEventListener("pointercancel", endPointer);
  cvs.addEventListener("contextmenu", (e) => e.preventDefault());
  cvs.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      cam.radius *= 1 + Math.sign(e.deltaY) * 0.08;
      clampCam();
      applyCamera();
    },
    { passive: false }
  );
}
