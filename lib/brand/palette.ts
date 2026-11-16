/**
 * PLAYCO BRAND COLOURS AS PLAIN HEX.
 *
 * The app's Tailwind tokens are CSS variables (app/globals.css), which only exist inside a rendered page. Everything
 * that is not a page — the web manifest, the browser theme colour, social images drawn by Satori, emails, the icon
 * generator — reads these constants instead. Keep the two in step: the channel values in globals.css are these.
 *
 * A LEAF MODULE with no imports, so plain-node scripts can load it.
 */
export const BRAND = {
  navy: "#102C40", // Midnight Navy
  cloud: "#F7FAFC", // Cloud White
  lime: "#DBFF00", // Electric Lime
} as const;

/** The dark context: photo cards, hero, social images, emails. */
export const DARK = {
  page: "#0A1E2C",
  surface: "#143650",
  surfaceRaised: "#1A3D57",
  text: BRAND.cloud,
  muted: "#A9BCCB",
  faint: "#8EA3B3",
  segment: "#2C4A60",
  line: "#2C4A60",
  warn: "#FFAA4C",
  danger: "#FF7A70",
} as const;

/** The light context: the page. */
export const LIGHT = {
  page: BRAND.cloud,
  surface: "#FFFFFF",
  text: BRAND.navy,
  muted: "#4B6274",
  faint: "#5E7383",
  line: "#DCE4EA",
  warn: "#B25E00",
  danger: "#C0362C",
} as const;
