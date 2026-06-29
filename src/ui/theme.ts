import { applyRoomTheme } from "../engine/scene";
import { $id } from "./dom";

const KEY = "bf-theme";

export type Theme = "light" | "dark";

function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function stored(): Theme | null {
  const v = localStorage.getItem(KEY);
  return v === "dark" || v === "light" ? v : null;
}

function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  applyRoomTheme(theme);
}

/** Wires the topbar toggle and keeps the theme in sync with the OS preference. */
export function initTheme(): void {
  // An inline <head> script sets the initial theme to avoid a flash; mirror it here.
  apply(stored() ?? systemTheme());

  $id("btnTheme").addEventListener("click", () => {
    const next: Theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(KEY, next);
    apply(next);
  });

  // Follow OS changes only while the user hasn't picked an explicit theme.
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", (e) => {
    if (!stored()) apply(e.matches ? "dark" : "light");
  });
}
