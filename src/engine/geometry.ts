import * as THREE from "three";
import { PLATE, STUD } from "../config/constants";

/* Geometry builders: pieces are centered in x,z with y spanning [0, H]. */

export function geoBox(W: number, D: number, H: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(W - 0.4, H, D - 0.4);
  g.translate(0, H / 2, 0);
  return g;
}

export function geoCyl(W: number, D: number, H: number): THREE.BufferGeometry {
  const r = (Math.min(W, D) / 2) * 0.98;
  const g = new THREE.CylinderGeometry(r, r, H, 28);
  g.translate(0, H / 2, 0);
  return g;
}

export function geoCone(W: number, D: number, H: number): THREE.BufferGeometry {
  const r = (Math.min(W, D) / 2) * 0.98;
  const g = new THREE.CylinderGeometry(r * 0.42, r, H, 28);
  g.translate(0, H / 2, 0);
  return g;
}

function extrudeAlongWidth(shape: THREE.Shape, W: number, D: number): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, { depth: W, bevelEnabled: false });
  g.rotateY(Math.PI / 2);
  g.translate(-W / 2, 0, D / 2);
  return g;
}

function extrudeAlongDepth(shape: THREE.Shape, W: number, D: number): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false });
  g.translate(-W / 2, 0, -D / 2);
  return g;
}

export function geoSlope(W: number, D: number, H: number, d: number): THREE.BufferGeometry {
  const lip = PLATE;
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(D, 0);
  s.lineTo(D, lip);
  if (d >= 2) {
    s.lineTo(STUD, H);
    s.lineTo(0, H);
  } else {
    s.lineTo(0, H);
  }
  s.closePath();
  return extrudeAlongWidth(s, W, D);
}

export function geoISlope(W: number, D: number, H: number): THREE.BufferGeometry {
  const lip = PLATE;
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(D, H - lip);
  s.lineTo(D, H);
  s.lineTo(0, H);
  s.closePath();
  return extrudeAlongWidth(s, W, D);
}

export function geoCheese(W: number, D: number, H: number): THREE.BufferGeometry {
  // Simple rising wedge: low at the front (z=0), full height at the back (z=D).
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(D, 0);
  s.lineTo(D, H);
  s.closePath();
  return extrudeAlongWidth(s, W, D);
}

export function geoCurve(W: number, D: number, H: number): THREE.BufferGeometry {
  // Convex "bow" top curving from the full-height back edge down to the front floor.
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(D, 0);
  s.lineTo(D, H);
  s.quadraticCurveTo(D * 0.45, H, 0, 0);
  s.closePath();
  return extrudeAlongWidth(s, W, D);
}

export function geoArch(W: number, D: number, H: number): THREE.BufferGeometry {
  const legW = STUD;
  const springY = H * 0.34;
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0, H);
  s.lineTo(W, H);
  s.lineTo(W, 0);
  s.lineTo(W - legW, 0);
  s.lineTo(W - legW, springY);
  s.quadraticCurveTo(W / 2, H, legW, springY);
  s.lineTo(legW, 0);
  s.closePath();
  return extrudeAlongDepth(s, W, D);
}
