import * as THREE from "three";
import { PLATE, STUD } from "../config/constants";
import { SHAPES } from "../config/shapes";
import { view } from "../core/store";
import type { ShapeKey } from "../core/types";
import { geoArch, geoBox, geoCheese, geoCone, geoCurve, geoCyl, geoISlope, geoSlope } from "./geometry";

type PieceMat = THREE.MeshStandardMaterial | THREE.MeshToonMaterial | THREE.MeshLambertMaterial;

const standardCache: Record<string, THREE.MeshStandardMaterial> = {};
const toonCache: Record<string, THREE.MeshToonMaterial> = {};
const instrCache: Record<string, THREE.MeshLambertMaterial> = {};

const toonOutlineMat = new THREE.MeshBasicMaterial({
  color: 0x1a1611,
  side: THREE.BackSide,
});

const instrOutlineMat = new THREE.MeshBasicMaterial({
  color: 0x000000,
  side: THREE.BackSide,
});

const edgeLineMat = new THREE.LineBasicMaterial({
  color: 0x000000,
});

const studHighlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

let toonGradient: THREE.DataTexture | null = null;

function getToonGradient(): THREE.DataTexture {
  if (toonGradient) return toonGradient;
  const data = new Uint8Array([40, 40, 40, 110, 110, 110, 180, 180, 180, 255, 255, 255]);
  toonGradient = new THREE.DataTexture(data, 4, 1, THREE.RGBFormat);
  toonGradient.minFilter = THREE.NearestFilter;
  toonGradient.magFilter = THREE.NearestFilter;
  toonGradient.generateMipmaps = false;
  toonGradient.needsUpdate = true;
  return toonGradient;
}

export function pieceMaterial(hex: string): PieceMat {
  if (view.pieceLook === "toon") {
    if (!toonCache[hex]) {
      toonCache[hex] = new THREE.MeshToonMaterial({
        color: new THREE.Color(hex),
        gradientMap: getToonGradient(),
      });
    }
    return toonCache[hex];
  }
  if (view.pieceLook === "instructions") {
    if (!instrCache[hex]) {
      instrCache[hex] = new THREE.MeshLambertMaterial({
        color: new THREE.Color(hex),
      });
    }
    return instrCache[hex];
  }
  if (!standardCache[hex]) {
    standardCache[hex] = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex),
      roughness: 0.42,
      metalness: 0,
    });
  }
  return standardCache[hex];
}

type StudPos = [number, number, number];

function studPositions(shape: ShapeKey, w: number, d: number, W: number, D: number, H: number): StudPos[] {
  const out: StudPos[] = [];
  const mode = SHAPES[shape].studs;
  const sx = (i: number) => -W / 2 + (i + 0.5) * STUD;
  const sz = (j: number) => -D / 2 + (j + 0.5) * STUD;
  const y = H + PLATE * 0.27;
  if (mode === "full") {
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push([sx(i), y, sz(j)]);
  } else if (mode === "back") {
    // geoSlope only leaves a flat stud-bearing shelf when it is 2+ studs deep;
    // a 1-deep roof tile is a bare wedge, so it carries no studs.
    if (d >= 2) {
      for (let i = 0; i < w; i++) out.push([sx(i), y, D / 2 - STUD / 2]);
    }
  } else if (mode === "top1" || mode === "center1") {
    out.push([0, H + PLATE * 0.27, 0]);
  }
  return out;
}

function clearDecorations(root: THREE.Object3D): void {
  const remove: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (o.userData.isOutline || o.userData.isEdgeLines || o.userData.isStudHighlight) remove.push(o);
  });
  for (const o of remove) {
    o.parent?.remove(o);
    const mesh = o as THREE.Mesh;
    if (mesh.userData.ownsGeometry && mesh.geometry) mesh.geometry.dispose();
  }
}

function addSilhouetteOutline(
  source: THREE.Mesh | THREE.InstancedMesh,
  parent: THREE.Object3D,
  mat: THREE.MeshBasicMaterial,
  scale: number,
  instScale: [number, number, number]
): void {
  if (source instanceof THREE.InstancedMesh) {
    const geo = source.geometry.clone();
    geo.scale(instScale[0], instScale[1], instScale[2]);
    const outline = new THREE.InstancedMesh(geo, mat, source.count);
    outline.instanceMatrix.copy(source.instanceMatrix);
    outline.instanceMatrix.needsUpdate = true;
    outline.userData.isOutline = true;
    outline.userData.ownsGeometry = true;
    outline.castShadow = false;
    outline.receiveShadow = false;
    outline.renderOrder = -1;
    parent.add(outline);
    return;
  }
  const outline = new THREE.Mesh(source.geometry, mat);
  outline.position.copy(source.position);
  outline.rotation.copy(source.rotation);
  outline.scale.copy(source.scale).multiplyScalar(scale);
  outline.userData.isOutline = true;
  outline.castShadow = false;
  outline.receiveShadow = false;
  outline.renderOrder = -1;
  parent.add(outline);
}

function addEdgeLines(source: THREE.Mesh, parent: THREE.Object3D): void {
  const edges = new THREE.EdgesGeometry(source.geometry, 22);
  const lines = new THREE.LineSegments(edges, edgeLineMat);
  lines.position.copy(source.position);
  lines.rotation.copy(source.rotation);
  lines.scale.copy(source.scale);
  lines.userData.isEdgeLines = true;
  lines.userData.ownsGeometry = true;
  lines.renderOrder = 2;
  parent.add(lines);
}

function addStudHighlights(studs: THREE.InstancedMesh, parent: THREE.Object3D): void {
  // Approximate stud radius from geometry bounding sphere.
  studs.geometry.computeBoundingSphere();
  const r = (studs.geometry.boundingSphere?.radius ?? STUD * 0.3) * 0.72;
  const ring = new THREE.TorusGeometry(r, r * 0.08, 6, 18);
  ring.rotateX(Math.PI / 2);
  const rings = new THREE.InstancedMesh(ring, studHighlightMat, studs.count);
  const src = new THREE.Matrix4();
  const dst = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  for (let i = 0; i < studs.count; i++) {
    studs.getMatrixAt(i, src);
    src.decompose(pos, quat, scl);
    pos.y += PLATE * 0.2;
    dst.compose(pos, quat, scl);
    rings.setMatrixAt(i, dst);
  }
  rings.instanceMatrix.needsUpdate = true;
  rings.userData.isStudHighlight = true;
  rings.userData.ownsGeometry = true;
  rings.renderOrder = 3;
  parent.add(rings);
}

function isRenderMesh(o: THREE.Object3D): o is THREE.Mesh | THREE.InstancedMesh {
  return (
    !o.userData.isOutline &&
    !o.userData.isEdgeLines &&
    !o.userData.isStudHighlight &&
    ((o as THREE.Mesh).isMesh === true || (o as THREE.InstancedMesh).isInstancedMesh === true) &&
    !!(o as THREE.Mesh).geometry
  );
}

/** Re-applies the active piece look (materials + outlines / edge lines). */
export function applyLookToGroup(group: THREE.Group, hex: string): void {
  clearDecorations(group);
  const mat = pieceMaterial(hex);
  const meshes: Array<THREE.Mesh | THREE.InstancedMesh> = [];
  group.traverse((o) => {
    if (isRenderMesh(o)) meshes.push(o);
  });
  const useShadows = view.shadows && view.pieceLook === "realistic";
  const look = view.pieceLook;
  for (const mesh of meshes) {
    mesh.material = mat;
    mesh.castShadow = useShadows;
    mesh.receiveShadow = useShadows;
    if (look === "toon") {
      addSilhouetteOutline(mesh, group, toonOutlineMat, 1.06, [1.18, 1.14, 1.18]);
    } else if (look === "instructions") {
      addSilhouetteOutline(mesh, group, instrOutlineMat, 1.035, [1.14, 1.1, 1.14]);
      if ((mesh as THREE.Mesh).isMesh && !(mesh instanceof THREE.InstancedMesh)) {
        addEdgeLines(mesh, group);
      } else if (mesh instanceof THREE.InstancedMesh) {
        addStudHighlights(mesh, group);
      }
    }
  }
}

export interface MadeBrick {
  group: THREE.Group;
  mesh: THREE.Mesh;
  h: number;
}

export function makeBrick(shape: ShapeKey, w: number, d: number, hex: string): MadeBrick {
  const S = SHAPES[shape];
  const H = S.h * PLATE;
  const W = w * STUD;
  const D = d * STUD;
  const mat = pieceMaterial(hex);
  let geo: THREE.BufferGeometry;
  switch (S.geo) {
    case "cyl": geo = geoCyl(W, D, H); break;
    case "cone": geo = geoCone(W, D, H); break;
    case "slope": geo = geoSlope(W, D, H, d); break;
    case "islope": geo = geoISlope(W, D, H); break;
    case "arch": geo = geoArch(W, D, H); break;
    case "cheese": geo = geoCheese(W, D, H); break;
    case "curve": geo = geoCurve(W, D, H); break;
    default: geo = geoBox(W, D, H);
  }
  geo.computeVertexNormals();
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(geo, mat);
  const useShadows = view.shadows && view.pieceLook === "realistic";
  mesh.castShadow = useShadows;
  mesh.receiveShadow = useShadows;
  group.add(mesh);
  const studs = studPositions(shape, w, d, W, D, H);
  if (studs.length) {
    const r = shape === "cone" ? STUD * 0.22 : STUD * 0.3;
    const sg = new THREE.CylinderGeometry(r, r, PLATE * 0.55, 14);
    const inst = new THREE.InstancedMesh(sg, mat, studs.length);
    inst.castShadow = useShadows;
    const m = new THREE.Matrix4();
    studs.forEach((p, i) => {
      m.makeTranslation(p[0], p[1], p[2]);
      inst.setMatrixAt(i, m);
    });
    inst.instanceMatrix.needsUpdate = true;
    group.add(inst);
  }
  applyLookToGroup(group, hex);
  return { group, mesh, h: S.h };
}

/**
 * Iterates every colorable material on an object tree (skips outline / edge helpers).
 */
export function eachMaterial(
  root: THREE.Object3D,
  fn: (mat: PieceMat, obj: THREE.Object3D) => void
): void {
  root.traverse((o) => {
    if (o.userData.isOutline || o.userData.isEdgeLines || o.userData.isStudHighlight) return;
    const mat = (o as THREE.Mesh).material as PieceMat | undefined;
    if (mat && "color" in mat) fn(mat, o);
  });
}
