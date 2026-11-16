import { BRAND, DARK } from "@/lib/brand/palette";

/**
 * What both share cards draw with: the game card (`shareImage.tsx`) and the
 * brand card (`brandImage.tsx`).
 *
 * COLOURS COME FROM `tailwind.config.ts`, read at module load. Satori (which
 * backs `ImageResponse`) does not run Tailwind, so the classes used elsewhere
 * are unavailable here and the values must be inlined — but they are inlined
 * FROM THE TOKEN TABLE, not retyped. A theme change therefore moves the cards
 * with it, which is the property the no-inline-hex rule exists to protect.
 */

export const COLORS = {
  volt: BRAND.lime,
  ink: BRAND.navy,
  bone: BRAND.cloud,
  muted: DARK.muted,
  faint: DARK.faint,
  surface: DARK.surface,
  surfaceSeg: DARK.segment,
  warn: DARK.warn,
  danger: DARK.danger,
  hairline: "rgba(247,250,252,.14)",
};

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";
