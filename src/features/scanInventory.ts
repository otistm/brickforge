import { COLORS } from "../config/colors";
import { blColorId, brickLinkUrl, lookupByPartNumber } from "../config/partMap";
import type { ShapeKey } from "../core/types";
import { selectPiece } from "../ui/controls";
import { $id } from "../ui/dom";
import { toast } from "../ui/toast";
import { identifyPart, type BrickognizeItem } from "./brickognize";

const STORAGE_KEY = "bf-scanned-inventory";

export interface ScannedPart {
  id: string;
  name: string;
  imgUrl: string;
  count: number;
  /** Optional color chosen by the user when adding. */
  colorIdx: number | null;
  shape: ShapeKey | null;
  w0: number | null;
  d0: number | null;
}

type InvMode = "buy" | "mine";

let mode: InvMode = "buy";
let scanned: ScannedPart[] = loadScanned();
let stream: MediaStream | null = null;
let pendingItems: BrickognizeItem[] = [];
let selectedMatch: BrickognizeItem | null = null;
let identifying = false;

function loadScanned(): ScannedPart[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScannedPart[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scanned));
}

function totalPieces(): number {
  return scanned.reduce((n, p) => n + p.count, 0);
}

function addOrBump(item: BrickognizeItem, count: number, colorIdx: number | null): void {
  const mapped = lookupByPartNumber(item.id);
  const existing = scanned.find(
    (p) => p.id === item.id && p.colorIdx === colorIdx
  );
  if (existing) {
    existing.count += count;
  } else {
    scanned.push({
      id: item.id,
      name: item.name,
      imgUrl: item.img_url,
      count,
      colorIdx,
      shape: mapped?.shape ?? null,
      w0: mapped?.w0 ?? null,
      d0: mapped?.d0 ?? null,
    });
  }
  scanned.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  persist();
}

function setMode(next: InvMode): void {
  mode = next;
  $id("invModeBuy").classList.toggle("on", mode === "buy");
  $id("invModeMine").classList.toggle("on", mode === "mine");
  $id("invBuyPane").hidden = mode !== "buy";
  $id("invMineHead").hidden = mode !== "mine";
  $id("invBuyBody").hidden = mode !== "buy";
  $id("invMinePane").hidden = mode !== "mine";
  if (mode === "mine") renderMineList();
}

function renderMineList(): void {
  const list = $id("mineList");
  const total = $id("mineTotal");
  if (scanned.length === 0) {
    list.innerHTML =
      '<div class="inv-empty">Scan a piece to start your inventory.<br>Take a photo of a LEGO® part and Brickognize will identify it.</div>';
    total.textContent = "Photo-powered parts inventory.";
    return;
  }
  total.textContent = `${totalPieces()} pieces · ${scanned.length} unique part${scanned.length > 1 ? "s" : ""}`;
  list.innerHTML = scanned
    .map((p, i) => {
      const color = p.colorIdx != null ? COLORS[p.colorIdx] : null;
      const href = brickLinkUrl(p.id, p.colorIdx != null ? blColorId(p.colorIdx) : null);
      const colorTxt = color ? ` · ${color[0]}` : "";
      const mapped =
        p.shape && p.w0 != null && p.d0 != null
          ? `${Math.min(p.w0, p.d0)}×${Math.max(p.w0, p.d0)}`
          : "";
      const useBtn =
        p.shape && p.w0 != null && p.d0 != null
          ? `<button class="btn mine-use" data-i="${i}" title="Select in builder">Use</button>`
          : "";
      return `<div class="part mine-part" data-i="${i}">
        <a class="pic lnk mine-pic" href="${href}" target="_blank" rel="noopener" title="View #${p.id} on BrickLink">
          <img src="${p.imgUrl}" alt="" loading="lazy" />
        </a>
        <div class="meta">
          <div class="nm">${p.name}</div>
          <div class="cl">#${p.id}${mapped ? ` · ${mapped}` : ""}${colorTxt}</div>
        </div>
        <div class="mine-ops">
          <div class="mine-qty">
            <button class="mine-step" data-act="dec" data-i="${i}" aria-label="Decrease">−</button>
            <span class="ctn">${p.count}</span>
            <button class="mine-step" data-act="inc" data-i="${i}" aria-label="Increase">+</button>
          </div>
          ${useBtn}
        </div>
      </div>`;
    })
    .join("");
}

function stopCamera(): void {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
  stream = null;
  const video = $id<HTMLVideoElement>("scanVideo");
  video.srcObject = null;
}

function showScanStep(step: "capture" | "results" | "confirm"): void {
  $id("scanStepCapture").hidden = step !== "capture";
  $id("scanStepResults").hidden = step !== "results";
  $id("scanStepConfirm").hidden = step !== "confirm";
}

function openOverlay(): void {
  $id("scanOverlay").classList.add("open");
  $id("scanOverlay").setAttribute("aria-hidden", "false");
  showScanStep("capture");
  $id("scanPreviewWrap").hidden = true;
  $id("scanCameraWrap").hidden = true;
  $id("scanBusy").hidden = true;
  pendingItems = [];
  selectedMatch = null;
  void startCamera();
}

function closeOverlay(): void {
  stopCamera();
  $id("scanOverlay").classList.remove("open");
  $id("scanOverlay").setAttribute("aria-hidden", "true");
  $id<HTMLInputElement>("scanFileInput").value = "";
  const prev = $id<HTMLImageElement>("scanPreview");
  if (prev.src.startsWith("blob:")) URL.revokeObjectURL(prev.src);
  prev.removeAttribute("src");
}

async function startCamera(): Promise<void> {
  const wrap = $id("scanCameraWrap");
  const captureBtn = $id<HTMLButtonElement>("btnScanCapture");
  const video = $id<HTMLVideoElement>("scanVideo");
  if (!navigator.mediaDevices?.getUserMedia) {
    wrap.hidden = true;
    captureBtn.hidden = true;
    return;
  }
  try {
    stopCamera();
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 960 } },
    });
    video.srcObject = stream;
    await video.play();
    wrap.hidden = false;
    captureBtn.hidden = false;
  } catch {
    wrap.hidden = true;
    captureBtn.hidden = true;
  }
}

function captureFrame(): Blob | null {
  const video = $id<HTMLVideoElement>("scanVideo");
  if (!stream || !video.videoWidth) return null;
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0);
  const data = canvas.toDataURL("image/jpeg", 0.92);
  const bin = atob(data.split(",")[1]!);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: "image/jpeg" });
}

function setPreview(url: string): void {
  const img = $id<HTMLImageElement>("scanPreview");
  if (img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
  img.src = url;
  $id("scanPreviewWrap").hidden = false;
}

async function runIdentify(blob: Blob, filename: string): Promise<void> {
  if (identifying) return;
  identifying = true;
  $id("scanBusy").hidden = false;
  try {
    const result = await identifyPart(blob, filename);
    pendingItems = result.items.filter((i) => i.type === "part").slice(0, 8);
    if (!pendingItems.length) {
      toast("No LEGO part recognized — try a clearer photo");
      showScanStep("capture");
      return;
    }
    renderResults();
    showScanStep("results");
  } catch (e) {
    console.warn("brickognize", e);
    toast("Couldn't reach Brickognize — try again");
  } finally {
    identifying = false;
    $id("scanBusy").hidden = true;
  }
}

function renderResults(): void {
  const el = $id("scanResults");
  el.innerHTML = pendingItems
    .map((item, i) => {
      const pct = Math.round(item.score * 100);
      const mapped = lookupByPartNumber(item.id);
      const tag = mapped
        ? `${Math.min(mapped.w0, mapped.d0)}×${Math.max(mapped.w0, mapped.d0)} in builder`
        : item.category ?? "Part";
      return `<button type="button" class="scan-match" data-i="${i}">
        <img src="${item.img_url}" alt="" loading="lazy" />
        <div class="scan-match-meta">
          <div class="nm">${item.name}</div>
          <div class="cl">#${item.id} · ${tag}</div>
        </div>
        <div class="scan-score">${pct}%</div>
      </button>`;
    })
    .join("");
}

function openConfirm(item: BrickognizeItem): void {
  selectedMatch = item;
  const mapped = lookupByPartNumber(item.id);
  $id<HTMLImageElement>("confirmPic").src = item.img_url;
  $id("confirmName").textContent = item.name;
  $id("confirmMeta").textContent = mapped
    ? `#${item.id} · ${Math.min(mapped.w0, mapped.d0)}×${Math.max(mapped.w0, mapped.d0)} ${mapped.shape}`
    : `#${item.id}${item.category ? ` · ${item.category}` : ""}`;
  $id<HTMLInputElement>("confirmQty").value = "1";
  buildConfirmSwatches();
  const useBtn = $id<HTMLButtonElement>("confirmUse");
  useBtn.hidden = !mapped;
  showScanStep("confirm");
}

function buildConfirmSwatches(): void {
  const el = $id("confirmSwatches");
  el.innerHTML = "";
  const none = document.createElement("button");
  none.type = "button";
  none.className = "scan-swatch none on";
  none.title = "No color";
  none.dataset.ci = "";
  none.onclick = () => selectConfirmColor(none);
  el.appendChild(none);
  COLORS.forEach((c, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "scan-swatch";
    b.style.background = c[1];
    b.title = c[0];
    b.dataset.ci = String(i);
    b.onclick = () => selectConfirmColor(b);
    el.appendChild(b);
  });
}

function selectConfirmColor(btn: HTMLButtonElement): void {
  [...$id("confirmSwatches").children].forEach((x) => x.classList.remove("on"));
  btn.classList.add("on");
}

function confirmColorIdx(): number | null {
  const on = $id("confirmSwatches").querySelector(".on") as HTMLButtonElement | null;
  if (!on || on.dataset.ci === "" || on.dataset.ci == null) return null;
  return Number(on.dataset.ci);
}

function confirmQty(): number {
  const n = Math.max(1, Math.min(999, Number($id<HTMLInputElement>("confirmQty").value) || 1));
  $id<HTMLInputElement>("confirmQty").value = String(n);
  return n;
}

function finishAdd(alsoSelect: boolean): void {
  if (!selectedMatch) return;
  const qty = confirmQty();
  const ci = confirmColorIdx();
  addOrBump(selectedMatch, qty, ci);
  if (alsoSelect) {
    const mapped = lookupByPartNumber(selectedMatch.id);
    if (mapped) selectPiece(mapped.shape, mapped.w0, mapped.d0, ci ?? undefined);
  }
  toast(alsoSelect ? "Added — piece ready to place" : `Added ${qty}× to My parts`);
  closeOverlay();
  setMode("mine");
  renderMineList();
}

export function initScanInventory(): void {
  $id("invModeBuy").onclick = () => setMode("buy");
  $id("invModeMine").onclick = () => setMode("mine");
  $id("btnScan").onclick = () => openOverlay();
  $id("btnScanClose").onclick = () => closeOverlay();
  $id("scanOverlay").addEventListener("click", (e) => {
    if (e.target === $id("scanOverlay")) closeOverlay();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $id("scanOverlay").classList.contains("open")) closeOverlay();
  });

  $id("btnScanFile").onclick = () => $id<HTMLInputElement>("scanFileInput").click();
  $id("btnScanCapture").onclick = async () => {
    const blob = captureFrame();
    if (!blob) {
      toast("Camera not ready — choose a photo instead");
      return;
    }
    setPreview(URL.createObjectURL(blob));
    stopCamera();
    await runIdentify(blob, "capture.jpg");
  };

  $id<HTMLInputElement>("scanFileInput").onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    stopCamera();
    await runIdentify(file, file.name || "photo.jpg");
  };

  $id("btnScanRetake").onclick = () => {
    pendingItems = [];
    selectedMatch = null;
    $id("scanPreviewWrap").hidden = true;
    showScanStep("capture");
    void startCamera();
  };

  $id("scanResults").onclick = (e) => {
    const btn = (e.target as HTMLElement).closest(".scan-match") as HTMLElement | null;
    if (!btn) return;
    const item = pendingItems[Number(btn.dataset.i)];
    if (item) openConfirm(item);
  };

  $id("btnConfirmBack").onclick = () => showScanStep("results");
  $id("btnConfirmAdd").onclick = () => finishAdd(false);
  $id("confirmUse").onclick = () => finishAdd(true);

  $id("mineList").onclick = (e) => {
    const t = e.target as HTMLElement;
    const step = t.closest(".mine-step") as HTMLElement | null;
    if (step) {
      const i = Number(step.dataset.i);
      const part = scanned[i];
      if (!part) return;
      if (step.dataset.act === "inc") part.count++;
      else {
        part.count--;
        if (part.count <= 0) scanned.splice(i, 1);
      }
      persist();
      renderMineList();
      return;
    }
    const use = t.closest(".mine-use") as HTMLElement | null;
    if (use) {
      const part = scanned[Number(use.dataset.i)];
      if (!part?.shape || part.w0 == null || part.d0 == null) return;
      selectPiece(part.shape, part.w0, part.d0, part.colorIdx ?? undefined);
      toast("Piece selected — click the stage to place");
    }
  };

  setMode("buy");
}
