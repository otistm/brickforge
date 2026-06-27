import * as THREE from "three";
import { PLATE, STUD } from "../config/constants";
import { SHAPES } from "../config/shapes";
import type { ShapeKey } from "../core/types";
import { geoArch, geoBox, geoCheese, geoCone, geoCurve, geoCyl, geoISlope, geoSlope } from "./geometry";

const matCache: Record<string, THREE.MeshStandardMaterial> = {};

export function pieceMaterial(hex: string): THREE.MeshStandardMaterial {
  if (!matCache[hex]) {
    matCache[hex] = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex),
      roughness: 0.42,
      metalness: 0,
    });
  }
  return matCache[hex];
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
    for (let i = 0; i < w; i++) out.push([sx(i), y, D / 2 - STUD / 2]);
  } else if (mode === "top1" || mode === "center1") {
    out.push([0, H + PLATE * 0.27, 0]);
  }
  return out;
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
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  const studs = studPositions(shape, w, d, W, D, H);
  if (studs.length) {
    const r = shape === "cone" ? STUD * 0.22 : STUD * 0.3;
    const sg = new THREE.CylinderGeometry(r, r, PLATE * 0.55, 14);
    const inst = new THREE.InstancedMesh(sg, mat, studs.length);
    inst.castShadow = true;
    const m = new THREE.Matrix4();
    studs.forEach((p, i) => {
      m.makeTranslation(p[0], p[1], p[2]);
      inst.setMatrixAt(i, m);
    });
    inst.instanceMatrix.needsUpdate = true;
    group.add(inst);
  }
  return { group, mesh, h: S.h };
}

/**
 * Iterates every standard material on an object tree.
 * Mirrors the prototype's `traverse(o => { if (o.material) ... })`.
 */
export function eachMaterial(
  root: THREE.Object3D,
  fn: (mat: THREE.MeshStandardMaterial, obj: THREE.Object3D) => void
): void {
  root.traverse((o) => {
    const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if (mat) fn(mat, o);
  });
}
