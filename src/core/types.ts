import type * as THREE from "three";

/** Width/depth footprint of a piece, measured in studs. */
export type Size = [number, number];

/** Where studs are drawn on top of a piece. */
export type StudMode = "full" | "none" | "back" | "top1" | "center1";

/** Which geometry builder produces a piece's mesh. */
export type GeoKind = "box" | "cyl" | "cone" | "slope" | "islope" | "arch" | "cheese" | "curve";

/** All supported piece shapes. */
export type ShapeKey =
  | "brick"
  | "plate"
  | "tile"
  | "jumper"
  | "slope"
  | "islope"
  | "cheese"
  | "curve"
  | "rbrick"
  | "rplate"
  | "cone"
  | "arch";

/** Static definition of a piece shape. */
export interface ShapeDef {
  label: string;
  /** Height in plates. */
  h: number;
  studs: StudMode;
  geo: GeoKind;
  sizes: Size[];
}

export type Tool = "build" | "erase";

/** Mutable selection state driven by the tool rail. */
export interface BuildState {
  colorIdx: number;
  shape: ShapeKey;
  size: Size;
  rot: number;
  tool: Tool;
}

/** A placed piece in the scene. */
export interface Brick {
  id: number;
  /** Grid origin (stud cells / plate layers). */
  gx: number;
  gy: number;
  gz: number;
  /** Authored (un-rotated) footprint. */
  w0: number;
  d0: number;
  /** Effective (rotation-applied) footprint. */
  ew: number;
  ed: number;
  /** Height in plates. */
  h: number;
  shape: ShapeKey;
  ci: number;
  rot: number;
  group: THREE.Group;
  mesh: THREE.Mesh;
}

/** Options for creating a brick. */
export interface AddBrickOptions {
  gx: number;
  gy: number;
  gz: number;
  w0: number;
  d0: number;
  shape: ShapeKey;
  ci: number;
  rot: number;
}

/** Result of resolving a pointer position to a grid cell. */
export interface Placement {
  gx: number;
  gy: number;
  gz: number;
  w: number;
  d: number;
  h: number;
}

/** Undoable history entries. */
export type UndoAction =
  | { type: "add"; id: number }
  | { type: "remove"; data: AddBrickOptions }
  | { type: "rotate"; id: number; fromRot: number };

/** Compact serialized brick tuple used for save/share. */
export type SerializedBrick = [
  gx: number,
  gy: number,
  gz: number,
  w0: number,
  d0: number,
  shapeIndex: number,
  ci: number,
  rot: number
];
