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

export const camera = new THREE.PerspectiveCamera(45, 1, 1, 5000);

scene.add(new THREE.HemisphereLight(0xffffff, 0xc9d0d8, 0.85));
scene.add(new THREE.AmbientLight(0xffffff, 0.18));

const sun = new THREE.DirectionalLight(0xffffff, 0.85);
sun.position.set(160, 280, 120);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
{
  const sc = sun.shadow.camera as THREE.OrthographicCamera;
  const span = BASE_STUDS * STUD * 0.75;
  sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.near = 10; sc.far = 900;
}
sun.shadow.bias = -0.0004;
scene.add(sun);

const fill = new THREE.DirectionalLight(0xffffff, 0.25);
fill.position.set(-140, 120, -100);
scene.add(fill);

/* ---------------- baseplate ---------------- */
export const baseW = BASE_STUDS * STUD;

const baseMat = new THREE.MeshStandardMaterial({ color: 0xcbd0cb, roughness: 0.75 });
export const baseBox = new THREE.Mesh(new THREE.BoxGeometry(baseW, PLATE * 1.6, baseW), baseMat);
baseBox.position.set(0, -PLATE * 0.8, 0);
baseBox.receiveShadow = true;
baseBox.userData.isBase = true;
scene.add(baseBox);

export const baseStuds: THREE.InstancedMesh = (() => {
  const g = new THREE.CylinderGeometry(STUD * 0.3, STUD * 0.3, PLATE * 0.5, 12);
  const m = new THREE.MeshStandardMaterial({ color: 0xc2c7c2, roughness: 0.8 });
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
