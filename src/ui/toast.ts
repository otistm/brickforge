import { $id } from "./dom";

const HINT_DEFAULT = "<b>Drag</b> to orbit · <b>Click</b> to place · <b>Right-click</b> or <b>R</b> to rotate";

let toastT: ReturnType<typeof setTimeout> | undefined;

export function toast(msg: string): void {
  const el = $id("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove("show"), 2200);
}

let hintT: ReturnType<typeof setTimeout> | undefined;

export function flashHint(): void {
  const h = $id("hint");
  const span = h.querySelector("span");
  if (!span) return;
  span.innerHTML = "<b>Nice!</b> Keep building — every piece lands in your parts list →";
  clearTimeout(hintT);
  hintT = setTimeout(() => {
    span.innerHTML = HINT_DEFAULT;
  }, 2600);
}
