import type { OrthographicCamera, PerspectiveCamera } from "three";
import { view } from "../core/store";
import { applyCamera, cam } from "./cameraControls";
import { camera, perspectiveCamera, renderer, scene } from "./scene";

export function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  if ((camera as PerspectiveCamera).isPerspectiveCamera) {
    perspectiveCamera.aspect = w / Math.max(h, 1);
    perspectiveCamera.updateProjectionMatrix();
  } else {
    // Orthographic frustum follows orbit radius.
    void (camera as OrthographicCamera);
    applyCamera();
  }
}

export function startLoop(): void {
  function loop(): void {
    requestAnimationFrame(loop);
    if (view.autoRotate) {
      cam.theta += 0.0045;
      applyCamera();
    }
    renderer.render(scene, camera);
  }
  loop();
}
