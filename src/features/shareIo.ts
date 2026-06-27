import { bricks } from "../core/store";
import { camera, renderer, scene } from "../engine/scene";
import { $id } from "../ui/dom";
import { toast } from "../ui/toast";
import { encode, loadData, serialize } from "./serialize";

export function download(blob: Blob, name: string): void {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export function initShareIo(): void {
  $id("btnShare").onclick = () => {
    if (!bricks.length) {
      toast("Build something first!");
      return;
    }
    location.hash = "b=" + encode();
    const url = location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => toast("Share link copied to clipboard"));
    } else {
      toast("Link added to the address bar");
    }
  };

  $id("btnExport").onclick = () => {
    download(new Blob([JSON.stringify(serialize())], { type: "application/json" }), "brickforge-build.json");
    toast("Build saved");
  };

  $id("btnImport").onclick = () => $id<HTMLInputElement>("fileInput").click();

  $id<HTMLInputElement>("fileInput").onchange = (e) => {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        loadData(JSON.parse(rd.result as string));
        toast("Build loaded");
      } catch {
        toast("That file couldn't be read");
      }
    };
    rd.readAsText(f);
    input.value = "";
  };

  $id("btnImg").onclick = () => {
    renderer.render(scene, camera);
    renderer.domElement.toBlob((b) => {
      if (!b) return;
      download(b, "brickforge.png");
      toast("Image saved");
    });
  };
}
