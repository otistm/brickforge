import * as THREE from "three";
import { COLORS } from "../config/colors";
import { bricks, view } from "../core/store";
import { applyCamera } from "./cameraControls";
import { resetGhostKey } from "./ghost";
import { applyLookToGroup, pieceMaterial } from "./pieceFactory";
import {
  applyLightingForLook,
  baseBox,
  baseStuds,
  scene,
  setEnvironmentVisible,
  setInstructionCamera,
  setShadowsEnabled,
  type PieceLook,
} from "./scene";

export type { PieceLook };

const STORAGE_KEY = "bf-settings";
const SETTINGS_VERSION = 2;

export interface AestheticSettings {
  look: PieceLook;
  showRoom: boolean;
  shadows: boolean;
}

const defaults: AestheticSettings = {
  look: "realistic",
  showRoom: true,
  shadows: true,
};

let settings: AestheticSettings = { ...defaults };

const toonOutlineMat = new THREE.MeshBasicMaterial({
  color: 0x1a1611,
  side: THREE.BackSide,
});

let baseStudOutline: THREE.InstancedMesh | null = null;
let baseBoxOutline: THREE.Mesh | null = null;
let baseEdgeLines: THREE.LineSegments | null = null;
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

export function getSettings(): AestheticSettings {
  return { ...settings };
}

function parseLook(raw: unknown, version: number): PieceLook {
  if (raw === "toon") return "toon";
  if (raw === "instructions") {
    // v1 stored the cel-shaded look as "instructions" — migrate to "toon".
    return version < 2 ? "toon" : "instructions";
  }
  return "realistic";
}

function loadSettings(): AestheticSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<AestheticSettings> & { version?: number };
    const version = parsed.version ?? 1;
    return {
      look: parseLook(parsed.look, version),
      showRoom: parsed.showRoom !== false,
      shadows: parsed.shadows !== false,
    };
  } catch {
    return { ...defaults };
  }
}

function persist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SETTINGS_VERSION, ...settings }));
}

function clearBaseDecorations(): void {
  if (baseBoxOutline) {
    scene.remove(baseBoxOutline);
    baseBoxOutline = null;
  }
  if (baseStudOutline) {
    scene.remove(baseStudOutline);
    baseStudOutline.geometry.dispose();
    baseStudOutline = null;
  }
  if (baseEdgeLines) {
    scene.remove(baseEdgeLines);
    baseEdgeLines.geometry.dispose();
    baseEdgeLines = null;
  }
}

function applyBaseLook(): void {
  clearBaseDecorations();
  if (settings.look === "toon") {
    baseBox.visible = true;
    baseStuds.visible = true;
    baseBox.material = new THREE.MeshToonMaterial({
      color: 0xa0a5a9,
      gradientMap: getToonGradient(),
    });
    baseStuds.material = new THREE.MeshToonMaterial({
      color: 0x8e9397,
      gradientMap: getToonGradient(),
    });
    baseBoxOutline = new THREE.Mesh(baseBox.geometry, toonOutlineMat);
    baseBoxOutline.position.copy(baseBox.position);
    baseBoxOutline.scale.set(1.01, 1.08, 1.01);
    baseBoxOutline.userData.isOutline = true;
    baseBoxOutline.renderOrder = -1;
    scene.add(baseBoxOutline);

    const geo = baseStuds.geometry.clone();
    geo.scale(1.2, 1.15, 1.2);
    baseStudOutline = new THREE.InstancedMesh(geo, toonOutlineMat, baseStuds.count);
    baseStudOutline.instanceMatrix.copy(baseStuds.instanceMatrix);
    baseStudOutline.instanceMatrix.needsUpdate = true;
    baseStudOutline.userData.isOutline = true;
    baseStudOutline.renderOrder = -1;
    scene.add(baseStudOutline);

    baseBox.castShadow = false;
    baseBox.receiveShadow = false;
    baseStuds.castShadow = false;
    baseStuds.receiveShadow = false;
  } else if (settings.look === "instructions") {
    // Floating model on a clean field — hide the plate, keep an invisible
    // collider so empty-board placement still works.
    baseBox.material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    baseBox.visible = true;
    baseStuds.visible = false;
    baseBox.castShadow = false;
    baseBox.receiveShadow = false;
    baseStuds.castShadow = false;
    baseStuds.receiveShadow = false;
  } else {
    baseBox.visible = true;
    baseStuds.visible = true;
    baseBox.material = new THREE.MeshStandardMaterial({ color: 0xa0a5a9, roughness: 0.75 });
    baseStuds.material = new THREE.MeshStandardMaterial({ color: 0x94999d, roughness: 0.8 });
    baseBox.receiveShadow = settings.shadows;
    baseStuds.receiveShadow = settings.shadows;
  }
}

function syncViewFlags(): void {
  view.pieceLook = settings.look;
  view.showRoom = settings.showRoom;
  view.shadows = settings.shadows;
}

/** Re-skins the board and every placed brick to match the current aesthetic settings. */
export function refreshWorldLook(): void {
  syncViewFlags();
  for (const b of bricks) {
    const hex = COLORS[b.ci]?.[1] ?? "#C91A09";
    delete b.mesh.userData._cloned;
    delete b.mesh.userData._hlColor;
    applyLookToGroup(b.group, hex);
    b.mesh.material = pieceMaterial(hex);
  }
  applyBaseLook();
  setEnvironmentVisible(settings.showRoom);
  setShadowsEnabled(settings.shadows && settings.look === "realistic");
  applyLightingForLook(settings.look);
  setInstructionCamera(settings.look === "instructions");
  applyCamera();
  resetGhostKey();
}

export function applySettings(patch: Partial<AestheticSettings>): void {
  settings = { ...settings, ...patch };
  persist();
  refreshWorldLook();
}

/** Loads saved settings and applies them once the scene exists. */
export function initRenderLook(): void {
  settings = loadSettings();
  refreshWorldLook();
}
