import * as THREE from "three";
import { COLORS } from "../config/colors";
import { PLATE, STUD } from "../config/constants";
import { lookupPart } from "../config/partMap";
import { bricks, view } from "../core/store";
import type { Brick } from "../core/types";
import { applyCamera, cam, clampCam } from "../engine/cameraControls";
import { hideGhost, isGhostVisible, setGhostVisible } from "../engine/ghost";
import { clearHighlight } from "../engine/highlight";
import { resize } from "../engine/loop";
import { baseBox, baseStuds, camera, renderer, scene, setEnvironmentVisible, shadowCatcher } from "../engine/scene";
import { $id } from "../ui/dom";
import { toast } from "../ui/toast";
import { groupBricks, type PartGroup } from "./inventory";
import { pieceSVG } from "./pieceSvg";

// Medium gray so already-placed pieces stay clearly visible as context
// (a near-white dim made earlier pieces vanish, making new ones look floating).
const dimMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.72, metalness: 0 });

function buildSteps(): Brick[][] {
  const sorted = [...bricks].sort((a, b) => a.gy - b.gy || a.gz - b.gz || a.gx - b.gx);
  const total = sorted.length;
  const per = total <= 10 ? 1 : total <= 24 ? 2 : total <= 48 ? 3 : 4;
  const layers = new Map<number, Brick[]>();
  for (const b of sorted) {
    if (!layers.has(b.gy)) layers.set(b.gy, []);
    layers.get(b.gy)!.push(b);
  }
  const steps: Brick[][] = [];
  [...layers.keys()].sort((a, b) => a - b).forEach((gy) => {
    const arr = layers.get(gy)!;
    for (let i = 0; i < arr.length; i += per) steps.push(arr.slice(i, i + per));
  });
  return steps;
}

function buildBounds(): { center: THREE.Vector3; radius: number } {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxY = 0;
  for (const b of bricks) {
    minX = Math.min(minX, b.gx);
    maxX = Math.max(maxX, b.gx + b.ew);
    minZ = Math.min(minZ, b.gz);
    maxZ = Math.max(maxZ, b.gz + b.ed);
    maxY = Math.max(maxY, b.gy + b.h);
  }
  const wx0 = minX * STUD, wx1 = maxX * STUD, wz0 = minZ * STUD, wz1 = maxZ * STUD, wy1 = maxY * PLATE;
  return {
    center: new THREE.Vector3((wx0 + wx1) / 2, wy1 / 2, (wz0 + wz1) / 2),
    radius: Math.max(0.5 * Math.hypot(wx1 - wx0, wy1, wz1 - wz0), STUD),
  };
}

type StoredMaterial = THREE.Material | THREE.Material[];

function captureSteps(steps: Brick[][]): { hero: string; imgs: string[] } {
  const SZ = 860;
  renderer.setSize(SZ, SZ);
  const saved = { theta: cam.theta, phi: cam.phi, radius: cam.radius, target: cam.target.clone() };
  const bb = buildBounds();
  // Keep the user's current viewing angle so the booklet matches the model they
  // built; only reframe the target + distance to fit the whole build.
  cam.target.copy(bb.center);
  cam.radius = bb.radius * 2.75;
  clampCam();
  applyCamera();
  // Square capture: perspective uses aspect; ortho frustum is forced square.
  if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
    (camera as THREE.PerspectiveCamera).aspect = 1;
    camera.updateProjectionMatrix();
  } else {
    const ortho = camera as THREE.OrthographicCamera;
    const half = cam.radius * 0.42;
    ortho.left = -half;
    ortho.right = half;
    ortho.top = half;
    ortho.bottom = -half;
    ortho.updateProjectionMatrix();
  }
  const ghostVis = isGhostVisible();
  hideGhost();
  clearHighlight();
  // Keep instruction images clean — no room/table behind the model.
  setEnvironmentVisible(false);

  const isHelper = (o: THREE.Object3D) =>
    !!(o.userData.isOutline || o.userData.isEdgeLines || o.userData.isStudHighlight);

  const orig = new Map<THREE.Object3D, StoredMaterial>();
  for (const b of bricks)
    b.group.traverse((o) => {
      if (isHelper(o)) return;
      const mat = (o as THREE.Mesh).material;
      if (mat) orig.set(o, mat);
    });

  const baseDecor = scene.children.filter(
    (c) => c.userData.isOutline || c.userData.isEdgeLines
  );
  // hero — clean "floating" model for the cover (no baseplate)
  baseBox.visible = false;
  if (baseStuds) baseStuds.visible = false;
  baseDecor.forEach((o) => { o.visible = false; });
  shadowCatcher.visible = true;
  for (const b of bricks) {
    b.group.visible = true;
    b.group.traverse((o) => {
      if (isHelper(o)) return;
      const stored = orig.get(o);
      if (stored) (o as THREE.Mesh).material = stored;
    });
  }
  renderer.render(scene, camera);
  const hero = renderer.domElement.toDataURL("image/png");

  // steps — keep the live look: baseplate only when not in instruction style
  const showBase = view.pieceLook !== "instructions";
  baseBox.visible = showBase;
  if (baseStuds) baseStuds.visible = showBase;
  baseDecor.forEach((o) => { o.visible = showBase; });
  shadowCatcher.visible = false;
  const imgs: string[] = [];
  const cumSet = new Set<Brick>();
  for (const stepBricks of steps) {
    const newSet = new Set(stepBricks);
    stepBricks.forEach((b) => cumSet.add(b));
    for (const b of bricks) {
      const inCum = cumSet.has(b);
      b.group.visible = inCum;
      b.group.traverse((o) => {
        if (isHelper(o) || !(o as THREE.Mesh).material) return;
        (o as THREE.Mesh).material = newSet.has(b) ? (orig.get(o) as StoredMaterial) : dimMat;
      });
    }
    renderer.render(scene, camera);
    imgs.push(renderer.domElement.toDataURL("image/png"));
  }

  // restore
  for (const b of bricks) {
    b.group.visible = true;
    b.group.traverse((o) => {
      if (isHelper(o)) return;
      const stored = orig.get(o);
      if ((o as THREE.Mesh).material && stored) (o as THREE.Mesh).material = stored;
    });
  }
  // Restore: instruction look keeps an invisible base collider for placement.
  baseBox.visible = true;
  if (baseStuds) baseStuds.visible = view.pieceLook !== "instructions";
  baseDecor.forEach((o) => { o.visible = view.pieceLook !== "instructions"; });
  shadowCatcher.visible = false;
  setEnvironmentVisible(view.showRoom);
  setGhostVisible(ghostVis);
  cam.theta = saved.theta;
  cam.phi = saved.phi;
  cam.radius = saved.radius;
  cam.target.copy(saved.target);
  applyCamera();
  resize();
  return { hero, imgs };
}

function partsRowHTML(g: PartGroup): string {
  const [nm, hex] = COLORS[g.ci];
  const part = lookupPart(g.shape, g.w0, g.d0);
  const pid = part ? `<span class="bk-pid">#${part}</span>` : "";
  return `<div class="bk-part"><div class="bk-pic">${pieceSVG(g.shape, g.w0, g.d0, hex)}</div>
    <div class="bk-pmeta"><span class="bk-pn">${g.size} ${g.label}</span><span class="bk-pc">${nm}${pid}</span></div>
    <div class="bk-px">${g.count}×</div></div>`;
}

function calloutItemHTML(g: PartGroup): string {
  const hex = COLORS[g.ci][1];
  return `<div class="st-cit">${pieceSVG(g.shape, g.w0, g.d0, hex)}<b>${g.count}×</b></div>`;
}

function renderBooklet(): void {
  const steps = buildSteps();
  const cap = captureSteps(steps);
  const allParts = groupBricks(bricks);
  const cover = `<div class="page cover">
    <div class="ck-top"><div class="lg"></div><div class="ck-brand">BrickForge</div></div>
    <div class="ck-stage"><img src="${cap.hero}" alt="Finished model"></div>
    <div class="ck-title">Building Instructions</div>
    <div class="ck-sub">A custom creation — designed and built by you</div>
    <div class="ck-stats">
      <div><b>${bricks.length}</b><span>pieces</span></div>
      <div><b>${steps.length}</b><span>steps</span></div>
      <div><b>${allParts.length}</b><span>unique parts</span></div>
    </div>
    <div class="ck-foot">SET 01 · ${bricks.length} PCS</div>
  </div>`;
  const partsPage = `<div class="page">
    <div class="pg-head"><h2>Parts List</h2><span>Gather these before you start</span></div>
    <div class="bk-grid">${allParts.map(partsRowHTML).join("")}</div>
    <div class="pg-foot"><span>BrickForge</span><span>Parts</span></div>
  </div>`;
  const stepPages = steps
    .map((s, i) => {
      const parts = groupBricks(s);
      return `<div class="page step">
      <div class="st-head"><div class="st-num">${i + 1}</div><div class="st-of">Step ${i + 1} <small>of ${steps.length}</small></div></div>
      <div class="st-callout"><div class="st-ctitle">Add these</div>${parts.map(calloutItemHTML).join("")}</div>
      <div class="st-stage"><img src="${cap.imgs[i]}" alt="Step ${i + 1}"></div>
      <div class="pg-foot"><span>BrickForge</span><span>${i + 1} / ${steps.length}</span></div>
    </div>`;
    })
    .join("");
  const pages = $id("bookletPages");
  pages.innerHTML = cover + partsPage + stepPages;
  pages.scrollTop = 0;
}

function openInstructions(): void {
  if (!bricks.length) {
    toast("Build something first — then I'll write the manual");
    return;
  }
  const ov = $id("bookletOverlay");
  $id("bookletPages").innerHTML =
    '<div class="booklet-loading"><div class="spin"></div>Rendering your instructions…</div>';
  ov.classList.add("show");
  setTimeout(renderBooklet, 50);
}

export function initBooklet(): void {
  $id("btnInstr").onclick = openInstructions;
  $id("btnCloseBooklet").onclick = () => {
    $id("bookletOverlay").classList.remove("show");
    $id("bookletPages").innerHTML = "";
  };
  $id("btnPrint").onclick = () => window.print();
}
