import type { ShapeKey } from "../core/types";

export function isLight(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

/** Renders a small 2D SVG thumbnail of a piece, used in inventory + booklet. */
export function pieceSVG(shape: ShapeKey, w: number, d: number, hex: string): string {
  const line = isLight(hex) ? "rgba(0,0,0,.28)" : "rgba(0,0,0,.22)";
  const dark = isLight(hex) ? "rgba(0,0,0,.18)" : "rgba(255,255,255,.20)";
  const W = 44;
  const H = 32;

  if (shape === "brick" || shape === "plate" || shape === "tile") {
    const a = Math.min(w, d);
    const c = Math.max(w, d);
    const cols = Math.min(c, 6);
    const rows = Math.min(a, 2);
    const cell = 6.5;
    const bw = cols * cell;
    const bh = Math.max(rows * cell, shape === "brick" ? 16 : 8);
    const ox = (W - bw) / 2;
    const oy = (H - bh) / 2;
    let studs = "";
    if (shape !== "tile") {
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++)
          studs += `<circle cx="${ox + i * cell + cell / 2}" cy="${oy + j * cell + cell / 2}" r="2" fill="${dark}"/>`;
    }
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect x="${ox}" y="${oy}" width="${bw}" height="${bh}" rx="2.5" fill="${hex}" stroke="${line}"/>${studs}</svg>`;
  }
  if (shape === "jumper") {
    const a = Math.min(w, d);
    const c = Math.max(w, d);
    const cols = Math.min(c, 6);
    const rows = Math.min(a, 2);
    const cell = 6.5;
    const bw = cols * cell;
    const bh = Math.max(rows * cell, 8);
    const ox = (W - bw) / 2;
    const oy = (H - bh) / 2;
    const stud = `<circle cx="${ox + bw / 2}" cy="${oy + bh / 2}" r="2" fill="${dark}"/>`;
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect x="${ox}" y="${oy}" width="${bw}" height="${bh}" rx="2.5" fill="${hex}" stroke="${line}"/>${stud}</svg>`;
  }
  if (shape === "cheese") {
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><polygon points="14,24 30,24 30,12" fill="${hex}" stroke="${line}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
  }
  if (shape === "curve") {
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><path d="M8 24 L36 24 L36 11 Q21 24 8 24 Z" fill="${hex}" stroke="${line}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
  }
  if (shape === "slope" || shape === "islope") {
    const poly = shape === "slope" ? "8,25 36,25 36,22 22,9 8,9" : "8,25 8,9 36,9 36,22";
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><polygon points="${poly}" fill="${hex}" stroke="${line}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="${shape === "slope" ? 12 : 14}" cy="6.5" r="2" fill="${dark}"/></svg>`;
  }
  if (shape === "rbrick" || shape === "rplate") {
    const ry = shape === "rbrick" ? 10 : 6;
    const cy = H / 2;
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect x="14" y="${cy - ry}" width="16" height="${ry * 2}" fill="${hex}"/><ellipse cx="22" cy="${cy + ry}" rx="8" ry="3.4" fill="${hex}" stroke="${line}"/><line x1="14" y1="${cy - ry}" x2="14" y2="${cy + ry}" stroke="${line}"/><line x1="30" y1="${cy - ry}" x2="30" y2="${cy + ry}" stroke="${line}"/><ellipse cx="22" cy="${cy - ry}" rx="8" ry="3.4" fill="${hex}" stroke="${line}"/><circle cx="22" cy="${cy - ry}" r="2.4" fill="${dark}"/></svg>`;
  }
  if (shape === "cone") {
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><polygon points="18,9 26,9 31,25 13,25" fill="${hex}" stroke="${line}" stroke-linejoin="round"/><ellipse cx="22" cy="25" rx="9" ry="3.2" fill="${hex}" stroke="${line}"/><ellipse cx="22" cy="9" rx="4" ry="1.8" fill="${dark}"/></svg>`;
  }
  if (shape === "arch") {
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><path d="M6 25 L6 11 L38 11 L38 25 L31 25 L31 18 Q22 9 13 18 L13 25 Z" fill="${hex}" stroke="${line}" stroke-linejoin="round"/></svg>`;
  }
  return "";
}
