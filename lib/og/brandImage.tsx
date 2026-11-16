import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { resolveStrings } from "@/lib/i18n/resolve";
import { COLORS, OG_SIZE } from "@/lib/og/theme";

/**
 * The brand share card — what a link to the site, or to any page without a
 * card of its own, shows in WhatsApp (2026-11-02).
 *
 * IT REPLACED "THE NEXT GAME". The root card used to lead with whichever game
 * came next, so a link to the home page previewed as one particular evening at
 * one particular pitch. Game links keep that card (`app/game/[id]`), which is
 * where it is the right answer.
 *
 * THE OWNER PICKED DRAFT C, "KICK-OFF", WITH DRAFT B'S LEFT ALIGNMENT: the mark
 * on the centre spot of a top-down pitch, the hero's two lines either side of
 * halfway, every line flush left. The mark sits dead centre on purpose —
 * WhatsApp sometimes previews a link as a small square cut from the middle,
 * and this is the one layout of the three where that square still shows the
 * brand. `lib/og/__tests__/brandImage.test.ts` decodes both properties.
 *
 * IN THE DEFAULT LOCALE, because that is the language the home page's title
 * and description reach a link preview in — no locale cookie travels with a
 * crawler.
 *
 * RENDERED AT BUILD (`force-static` on the route), which is what makes the two
 * file reads below safe: `lib/og/mark.ts` explains why a request-time read of
 * `public/` is not. The font is Anton, the hero's display face, under the SIL
 * Open Font License (`lib/og/fonts/OFL.txt`); the mark is the 512px master,
 * because the 112px copy in `mark.ts` would be upscaled to twice its size.
 */

/** The mark's diameter: it fills the centre circle. */
export const BRAND_MARK_PX = 236;

/**
 * THE SHARE CARD (rebrand). Midnight Navy, the court-corners logo at the centre, the hero line beneath it with the
 * sport in lime, and the tagline. No pitch drawing: the brand is sport-neutral, and the card says "volleyball" only
 * in words, which change with the copy.
 *
 * Montserrat ExtraBold is the logo's typeface; it is read from `lib/og/fonts` because Satori cannot use web fonts.
 */
export function renderBrandImage(): ImageResponse {
  const t = resolveStrings(DEFAULT_LOCALE);
  const extraBold = readFileSync(join(process.cwd(), "lib/og/fonts/Montserrat-ExtraBold.ttf"));
  const bold = readFileSync(join(process.cwd(), "lib/og/fonts/Montserrat-Bold.ttf"));
  const LOGO_PX = 92;
  const corner = Math.round(LOGO_PX * 0.62);
  const stroke = Math.round(LOGO_PX * 0.1);
  const full = { position: "absolute", top: 0, left: 0, width: OG_SIZE.width, height: OG_SIZE.height } as const;

  return new ImageResponse(
    (
      <div
        style={{
          ...full,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.ink,
          fontFamily: "Montserrat",
          color: COLORS.bone,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            fontSize: LOGO_PX,
            fontWeight: 800,
            letterSpacing: LOGO_PX * 0.12,
            lineHeight: 1,
            padding: `${LOGO_PX * 0.5}px ${LOGO_PX * 0.62}px ${LOGO_PX * 0.5}px ${LOGO_PX * 0.7}px`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: corner,
              height: corner,
              borderLeft: `${stroke}px solid ${COLORS.volt}`,
              borderTop: `${stroke}px solid ${COLORS.volt}`,
            }}
          />
          {"PLAYCO"}
          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: corner,
              height: corner,
              borderRight: `${stroke}px solid ${COLORS.volt}`,
              borderBottom: `${stroke}px solid ${COLORS.volt}`,
            }}
          />
        </div>
        <div style={{ display: "flex", marginTop: 44, fontSize: 40, fontWeight: 700 }}>
          <span>{t.landing.heroLine1}&nbsp;</span>
          <span style={{ color: COLORS.volt }}>{t.landing.heroLine2}</span>
        </div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 24, fontWeight: 700, letterSpacing: 4, color: COLORS.muted }}>
          {t.meta.shareTagline.toLocaleUpperCase(DEFAULT_LOCALE)}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Montserrat", data: extraBold, weight: 800, style: "normal" },
        { name: "Montserrat", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
