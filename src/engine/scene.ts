import * as THREE from "three";
import { BASE_STUDS, HALF, PLATE, STUD } from "../config/constants";

export const stageEl = document.getElementById("stage") as HTMLElement;

export const scene = new THREE.Scene();

export const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stageEl.appendChild(renderer.domElement);

/** Convenience handle to the WebGL canvas element. */
export const cvs = renderer.domElement;

export const perspectiveCamera = new THREE.PerspectiveCamera(45, 1, 1, 5000);
export const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 5000);
/** Active camera — swapped for orthographic instruction-booklet look. */
export let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera = perspectiveCamera;

const hemi = new THREE.HemisphereLight(0xffffff, 0xc9d0d8, 0.85);
scene.add(hemi);
const ambient = new THREE.AmbientLight(0xffffff, 0.18);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 0.85);
sun.position.set(160, 280, 120);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
{
  const sc = sun.shadow.camera as THREE.OrthographicCamera;
  const span = BASE_STUDS * STUD * 0.95;
  sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.near = 10; sc.far = 900;
}
sun.shadow.bias = -0.0004;
scene.add(sun);

const fill = new THREE.DirectionalLight(0xffffff, 0.25);
fill.position.set(-140, 120, -100);
scene.add(fill);

/** Key light from top-front-left for instruction manuals (3-tone faces). */
const instrKey = new THREE.DirectionalLight(0xffffff, 0);
instrKey.position.set(-120, 260, 180);
scene.add(instrKey);
const instrFill = new THREE.DirectionalLight(0xffffff, 0);
instrFill.position.set(160, 80, -40);
scene.add(instrFill);

export type PieceLook = "realistic" | "toon" | "instructions";

/** Tuning lights for each aesthetic. */
export function applyLightingForLook(look: PieceLook): void {
  if (look === "instructions") {
    hemi.intensity = 0.35;
    ambient.intensity = 0.55;
    sun.intensity = 0;
    fill.intensity = 0;
    instrKey.intensity = 0.85;
    instrFill.intensity = 0.4;
  } else if (look === "toon") {
    hemi.intensity = 0.55;
    ambient.intensity = 0.7;
    sun.intensity = 0.55;
    fill.intensity = 0.35;
    instrKey.intensity = 0;
    instrFill.intensity = 0;
  } else {
    hemi.intensity = 0.85;
    ambient.intensity = 0.18;
    sun.intensity = 0.85;
    fill.intensity = 0.25;
    instrKey.intensity = 0;
    instrFill.intensity = 0;
  }
}

/** Switches between perspective (realistic/toon) and orthographic (instructions). */
export function setInstructionCamera(on: boolean): void {
  const prev = camera;
  camera = on ? orthoCamera : perspectiveCamera;
  camera.position.copy(prev.position);
  camera.quaternion.copy(prev.quaternion);
  camera.up.copy(prev.up);
}

export function setShadowsEnabled(on: boolean): void {
  renderer.shadowMap.enabled = on;
  sun.castShadow = on;
  // Force materials/shadow maps to refresh on the next frame.
  renderer.shadowMap.needsUpdate = true;
}

/* ---------------- baseplate ---------------- */
export const baseW = BASE_STUDS * STUD;

const baseMat: THREE.Material = new THREE.MeshStandardMaterial({ color: 0xa0a5a9, roughness: 0.75 });
export const baseBox = new THREE.Mesh(new THREE.BoxGeometry(baseW, PLATE * 1.6, baseW), baseMat);
baseBox.position.set(0, -PLATE * 0.8, 0);
baseBox.receiveShadow = true;
baseBox.userData.isBase = true;
scene.add(baseBox);

export const baseStuds: THREE.InstancedMesh = (() => {
  const g = new THREE.CylinderGeometry(STUD * 0.3, STUD * 0.3, PLATE * 0.5, 12);
  const m: THREE.Material = new THREE.MeshStandardMaterial({ color: 0x94999d, roughness: 0.8 });
  const inst = new THREE.InstancedMesh(g, m, BASE_STUDS * BASE_STUDS);
  inst.receiveShadow = true;
  const mtx = new THREE.Matrix4();
  let i = 0;
  for (let x = -HALF; x < HALF; x++)
    for (let z = -HALF; z < HALF; z++) {
      mtx.makeTranslation((x + 0.5) * STUD, PLATE * 0.25, (z + 0.5) * STUD);
      inst.setMatrixAt(i++, mtx);
    }
  inst.instanceMatrix.needsUpdate = true;
  scene.add(inst);
  return inst;
})();

/** Shadow catcher used only while rendering instruction images (baseplate hidden). */
export const shadowCatcher = new THREE.Mesh(
  new THREE.PlaneGeometry(baseW * 3, baseW * 3),
  new THREE.ShadowMaterial({ opacity: 0.16 })
);
shadowCatcher.rotation.x = -Math.PI / 2;
shadowCatcher.position.y = 0.02;
shadowCatcher.receiveShadow = true;
shadowCatcher.visible = false;
scene.add(shadowCatcher);

/* ---------------- room + table ----------------
   The baseplate sits on a wooden table inside a simple enclosed room. The
   camera orbits inside the room (see clampCam's max radius), and there is no
   ceiling so high/top-down angles look down into the space. */
export const ROOM_HALF = 820;
const FLOOR_Y = -250;
const WALL_H = 650;
/** The baseplate's underside — the table surface is flush with it. */
const TABLE_SURFACE_Y = -PLATE * 1.6;
const TABLE_THICK = 18;
const TABLE_HALF = baseW * 0.82;

export const room = new THREE.Group();
room.name = "room";

const floorMat = new THREE.MeshStandardMaterial({ color: 0xb9b2a4, roughness: 0.97, metalness: 0 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_HALF * 2, ROOM_HALF * 2), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = FLOOR_Y;
floor.receiveShadow = true;
room.add(floor);

/** Room wall colors: soft light blue by day, deep midnight blue in dark mode. */
const WALL_LIGHT = 0xb8d4ec;
const WALL_DARK = 0x1c2747;
const wallMat = new THREE.MeshStandardMaterial({
  color: WALL_LIGHT, roughness: 1, metalness: 0, side: THREE.DoubleSide,
});
function addWall(x: number, z: number, ry: number): void {
  const w = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_HALF * 2, WALL_H), wallMat);
  w.position.set(x, FLOOR_Y + WALL_H / 2, z);
  w.rotation.y = ry;
  room.add(w);
}
addWall(0, -ROOM_HALF, 0);              // back
addWall(0, ROOM_HALF, Math.PI);         // front
addWall(-ROOM_HALF, 0, Math.PI / 2);    // left
addWall(ROOM_HALF, 0, -Math.PI / 2);    // right

const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4424, roughness: 0.6, metalness: 0 });
const tableTop = new THREE.Mesh(
  new THREE.BoxGeometry(TABLE_HALF * 2, TABLE_THICK, TABLE_HALF * 2),
  woodMat
);
tableTop.position.set(0, TABLE_SURFACE_Y - TABLE_THICK / 2, 0);
tableTop.receiveShadow = true;
tableTop.castShadow = true;
room.add(tableTop);

const legMat = new THREE.MeshStandardMaterial({ color: 0x563418, roughness: 0.7, metalness: 0 });
const legTopY = TABLE_SURFACE_Y - TABLE_THICK;
const legH = legTopY - FLOOR_Y;
const legSize = 22;
const legInset = TABLE_HALF - 30;
for (const sx of [-1, 1])
  for (const sz of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(legSize, legH, legSize), legMat);
    leg.position.set(sx * legInset, FLOOR_Y + legH / 2, sz * legInset);
    leg.castShadow = true;
    room.add(leg);
  }

scene.add(room);

/** Toggles the room + table (hidden while capturing clean instruction images). */
export function setEnvironmentVisible(v: boolean): void {
  room.visible = v;
}

export { sun };

/** Recolors the room walls to match the active UI theme. */
export function applyRoomTheme(theme: "light" | "dark"): void {
  wallMat.color.set(theme === "dark" ? WALL_DARK : WALL_LIGHT);
}
