import { ImageResponse } from "next/og";
import { OG_MARK_DATA_URI } from "@/lib/og/mark";
import { COLORS, OG_SIZE } from "@/lib/og/theme";
import { strings } from "@/lib/strings";

/**
 * A BLOG POST'S SHARE CARD (24 Nov 2026): the brand's mark and wordmark, then the post's title — the same ink
 * card a shared game draws, so a link to a post and a link to a game are recognisably one site. Used when a post
 * has no photograph of its own.
 *
 * Satori's rules, as in `shareImage.tsx`: every element with more than one child declares `display`, and the
 * title is a text child, never parsed as markup.
 */
const PADDING = 72;
const MARK_SIZE = 56;
const TITLE_LINES = 4;

export function renderPostImage({ title, label }: { title: string; label: string }): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: COLORS.ink,
          padding: PADDING,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={OG_MARK_DATA_URI} width={MARK_SIZE} height={MARK_SIZE} style={{ borderRadius: MARK_SIZE / 2 }} alt="" />
          <div style={{ display: "flex", gap: 10, color: COLORS.bone, fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>
            <span>{strings.brand.wordmarkLead}</span>
            <span style={{ color: COLORS.volt }}>{strings.brand.wordmarkAccent}</span>
          </div>
        </div>

        <div
          style={{
            color: "#FFFFFF",
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -1,
            display: "-webkit-box",
            WebkitLineClamp: TITLE_LINES,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            borderTop: `2px solid ${COLORS.hairline}`,
            paddingTop: 32,
            color: COLORS.volt,
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          {label}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
