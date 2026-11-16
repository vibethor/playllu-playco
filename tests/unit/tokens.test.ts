import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND, DARK, LIGHT } from "@/lib/brand/palette";
import tailwindConfig from "@/tailwind.config";

/*
 * PLAYCO THEME TOKENS (rebrand). The colours are CSS variables defined in app/globals.css, with the light page on
 * `:root` and dark islands on `.theme-dark`. These tests hold the three facts the system depends on:
 *   1. the brand colours are exactly Midnight Navy, Cloud White and Electric Lime, in both places they live;
 *   2. every Tailwind colour token reads a variable (no stray hex that ignores the context);
 *   3. the text pairs people actually read clear WCAG AA (4.5:1).
 * (HrajFotbal's version of this file asserted its own volt-on-black values.)
 */

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
const colors = (tailwindConfig.theme?.extend?.colors ?? {}) as Record<string, string>;

function channels(name: string, block: "root" | "dark"): string {
  const start = block === "root" ? css.indexOf(":root {") : css.indexOf(".theme-dark {");
  const body = css.slice(start, css.indexOf("}", start));
  const match = body.match(new RegExp(`--c-${name}:\\s*([0-9 ]+);`));
  if (!match) throw new Error(`--c-${name} is not defined in the ${block} block`);
  return match[1]!.trim();
}
function hexToChannels(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}
function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const lin = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe("the brand colours", () => {
  it("are Midnight Navy, Cloud White and Electric Lime", () => {
    // Arrange / Act / Assert
    expect(BRAND).toEqual({ navy: "#102C40", cloud: "#F7FAFC", lime: "#DBFF00" });
  });

  it("are the same values in globals.css as in lib/brand/palette.ts", () => {
    // Arrange
    const pairs = [
      ["navy", BRAND.navy],
      ["cloud", BRAND.cloud],
      ["lime", BRAND.lime],
    ] as const;

    // Act
    const mismatches = pairs.filter(([name, hex]) => channels(name, "root") !== hexToChannels(hex));

    // Assert
    expect(mismatches).toEqual([]);
  });
});

describe("the Tailwind colour tokens", () => {
  it("read a CSS variable, apart from the three third-party brand colours", () => {
    // Arrange
    const thirdParty = new Set(["whatsapp", "instagram", "telegram"]);

    // Act
    const literal = Object.entries(colors).filter(([name, value]) => !thirdParty.has(name) && !value.includes("var(--"));

    // Assert
    expect(literal).toEqual([]);
  });

  it("make accent text navy on the light page and lime on a dark island", () => {
    // Arrange / Act
    const light = channels("accent", "root");
    const dark = channels("accent", "dark");

    // Assert
    expect([light, dark]).toEqual([hexToChannels(BRAND.navy), hexToChannels(BRAND.lime)]);
  });
});

describe("contrast", () => {
  it("clears AA for every text tone on the light page", () => {
    // Arrange
    const tones = [LIGHT.text, LIGHT.muted, LIGHT.faint];

    // Act
    const ratios = tones.map((tone) => contrast(tone, LIGHT.page));

    // Assert
    expect(ratios.every((r) => r >= 4.5)).toBe(true);
  });

  it("clears AA for text on navy, on lime buttons, and for the dark-island warnings", () => {
    // Arrange
    const pairs: [string, string][] = [
      [BRAND.cloud, BRAND.navy],
      [BRAND.navy, BRAND.lime],
      [BRAND.lime, BRAND.navy],
      [DARK.muted, DARK.page],
      [DARK.warn, DARK.page],
      [DARK.danger, DARK.page],
    ];

    // Act
    const ratios = pairs.map(([fg, bg]) => contrast(fg, bg));

    // Assert
    expect(ratios.every((r) => r >= 4.5)).toBe(true);
  });
});
