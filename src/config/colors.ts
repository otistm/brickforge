/** [displayName, hex] */
export type ColorEntry = readonly [name: string, hex: string];

/**
 * Real LEGO solid colors — BrickLink/official names with
 * Rebrickable/LDraw-standard hex values.
 */
export const COLORS: readonly ColorEntry[] = [
  ["White", "#FFFFFF"], ["Very Light Bluish Gray", "#E6E3DA"], ["Light Bluish Gray", "#A0A5A9"],
  ["Dark Bluish Gray", "#6C6E68"], ["Black", "#05131D"],
  ["Red", "#C91A09"], ["Dark Red", "#720E0F"], ["Coral", "#FF698F"], ["Dark Pink", "#C870A0"], ["Magenta", "#901F76"],
  ["Dark Purple", "#3F3691"], ["Purple", "#81007B"], ["Medium Lavender", "#AC78BA"],
  ["Dark Blue", "#0A3463"], ["Blue", "#0055BF"], ["Medium Blue", "#5A93DB"], ["Sand Blue", "#6074A1"],
  ["Dark Azure", "#078BC9"], ["Medium Azure", "#36AEBF"], ["Dark Turquoise", "#008F9B"],
  ["Dark Green", "#184632"], ["Green", "#237841"], ["Bright Green", "#4B9F4A"],
  ["Sand Green", "#A0BCAC"], ["Olive Green", "#9B9A5A"], ["Lime", "#A5CA18"],
  ["Yellow", "#F2CD37"], ["Bright Light Yellow", "#FBE696"], ["Bright Light Orange", "#F8BB3D"],
  ["Medium Orange", "#FFA70B"], ["Orange", "#FE8A18"], ["Dark Orange", "#A95500"],
  ["Reddish Brown", "#582A12"], ["Dark Brown", "#352100"], ["Nougat", "#D09168"],
  ["Tan", "#E4CD9E"], ["Dark Tan", "#958A73"],
];
