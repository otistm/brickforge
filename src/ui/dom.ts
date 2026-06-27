/** getElementById with a type cast and a hard failure when missing. */
export function $id<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`BrickForge: missing element #${id}`);
  return el as T;
}

/** querySelector with a type cast and a hard failure when missing. */
export function $<T extends HTMLElement = HTMLElement>(selector: string): T {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`BrickForge: missing element ${selector}`);
  return el as T;
}
