import { view } from "../core/store";
import { applyCamera, cam } from "./cameraControls";
import { camera, renderer, scene } from "./scene";

export function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
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
