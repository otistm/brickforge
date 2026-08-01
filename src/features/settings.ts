import { applySettings, getSettings, type PieceLook } from "../engine/renderLook";
import { $id } from "../ui/dom";
import { toast } from "../ui/toast";

const LOOK_LABELS: Record<PieceLook, string> = {
  realistic: "Realistic look on",
  toon: "Toon shader on",
  instructions: "Instruction booklet look on",
};

function syncForm(): void {
  const s = getSettings();
  $id<HTMLInputElement>("setLookRealistic").checked = s.look === "realistic";
  $id<HTMLInputElement>("setLookToon").checked = s.look === "toon";
  $id<HTMLInputElement>("setLookInstructions").checked = s.look === "instructions";
  $id<HTMLInputElement>("setShowRoom").checked = s.showRoom;
  $id<HTMLInputElement>("setShadows").checked = s.shadows;
  $id("setShadowsRow").classList.toggle("disabled", s.look !== "realistic");
}

function openPanel(): void {
  syncForm();
  $id("settingsOverlay").classList.add("open");
  $id("settingsOverlay").setAttribute("aria-hidden", "false");
}

function closePanel(): void {
  $id("settingsOverlay").classList.remove("open");
  $id("settingsOverlay").setAttribute("aria-hidden", "true");
}

export function initSettings(): void {
  syncForm();

  $id("btnSettings").onclick = () => openPanel();
  $id("btnSettingsClose").onclick = () => closePanel();
  $id("settingsOverlay").addEventListener("click", (e) => {
    if (e.target === $id("settingsOverlay")) closePanel();
  });

  const applyLook = (look: PieceLook) => {
    applySettings({ look });
    syncForm();
    toast(LOOK_LABELS[look]);
  };

  $id<HTMLInputElement>("setLookRealistic").onchange = () => applyLook("realistic");
  $id<HTMLInputElement>("setLookToon").onchange = () => applyLook("toon");
  $id<HTMLInputElement>("setLookInstructions").onchange = () => applyLook("instructions");

  $id<HTMLInputElement>("setShowRoom").onchange = (e) => {
    applySettings({ showRoom: (e.target as HTMLInputElement).checked });
  };

  $id<HTMLInputElement>("setShadows").onchange = (e) => {
    applySettings({ shadows: (e.target as HTMLInputElement).checked });
  };

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $id("settingsOverlay").classList.contains("open")) closePanel();
  });
}
