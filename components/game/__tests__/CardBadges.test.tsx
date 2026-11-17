import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { strings } from "@/lib/strings";

vi.mock("@/lib/i18n/server", () => ({ getStrings: async () => strings, getLocale: async () => "en" }));

const { CardBadges } = await import("@/components/game/CardBadges");

const tag = (html: string, testId: string) => html.match(new RegExp(`<span[^>]*data-testid="${testId}"[^>]*>`))?.[0] ?? "";

/**
 * THE CARD SAYS INDOOR OR BEACH AND THE FORMAT (owner, 17 Nov 2026: "on the game card it should say if it's indoor
 * or beach volleyball with a tag"; "I can't see the format if it's 6v6 or 5v5").
 */
describe("CardBadges on a list card", () => {
  it("shows the game type as the card's tag", async () => {
    // Act
    const html = renderToStaticMarkup(await CardBadges({ format: "5v5", surface: "sand", layout: "card" }));

    // Assert
    expect(tag(html, "game-surface")).not.toBe("");
    expect(html).toContain(strings.games.surface.sand);
  });

  it("draws Indoor and Beach at one width", async () => {
    // Act
    const beach = tag(renderToStaticMarkup(await CardBadges({ format: null, surface: "sand", layout: "card" })), "game-surface");
    const indoor = tag(renderToStaticMarkup(await CardBadges({ format: null, surface: "indoor", layout: "card" })), "game-surface");

    // Assert
    const width = (s: string) => s.match(/\bw-\[\d+px\]/)?.[0];
    expect(width(beach)).toBeDefined();
    expect(width(beach)).toBe(width(indoor));
  });

  /*
   * THE FORMAT LEADS (owner, 17 Nov 2026, with a HrajFotbal screenshot): "put the format instead of that pill …
   * … make it stand out a bit more", and the game type "all the way to the right".
   */
  it("puts the format first, as the lime pill", async () => {
    // Act
    const html = renderToStaticMarkup(
      await CardBadges({ format: "6v6", surface: "indoor", layout: "card" }),
    );

    // Assert
    const format = tag(html, "game-format");
    expect(format).toContain("h-7");
    expect(format).toContain("bg-volt");
    expect(html.indexOf('data-testid="game-format"')).toBeLessThan(html.indexOf('data-testid="game-surface"'));
  });

  /*
   * ONE SIZE FOR THE TWO PILLS (owner, 17 Nov 2026): "make the beach pill the same as the format pill in terms of
   * size".
   */
  it("draws the game type at the format pill's size, in the quieter ink", async () => {
    // Act
    const html = renderToStaticMarkup(await CardBadges({ format: "6v6", surface: "indoor", layout: "card" }));

    // Assert
    const format = tag(html, "game-format");
    const surface = tag(html, "game-surface");
    const size = (s: string) => s.match(/(?<![\w-])(h-\d+|text-small|(?:min-)?w-\[\d+px\])(?![\w-])/g)?.sort();
    expect(size(surface)).toEqual(size(format));
    expect(surface).not.toContain("bg-volt");
  });

  it("has no format pill when the organizer set none", async () => {
    // Act
    const html = renderToStaticMarkup(await CardBadges({ format: null, surface: "indoor", layout: "card" }));

    // Assert
    expect(html).not.toContain('data-testid="game-format"');
  });
});

describe("CardBadges on the game page", () => {
  it("still shows the format there", async () => {
    // Act
    const html = renderToStaticMarkup(await CardBadges({ format: "5v5", surface: "sand" }));

    // Assert
    expect(html).toContain('data-testid="game-format"');
  });
});
