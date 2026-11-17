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

  it("draws Indoor and Beach at one fixed width", async () => {
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
   * around the same size as the languages … make it stand out a bit more", the game type "a bit smaller … all the
   * way to the right", and the languages "under the newly placed beach or indoor … centered".
   */
  it("puts the format first, as a lime pill the height of the languages pill", async () => {
    // Act
    const html = renderToStaticMarkup(
      await CardBadges({ format: "6v6", surface: "indoor", language: "en", layout: "card" }),
    );

    // Assert
    const format = tag(html, "game-format");
    expect(format).toContain("h-7");
    expect(format).toContain("bg-volt");
    expect(html.indexOf('data-testid="game-format"')).toBeLessThan(html.indexOf('data-testid="game-surface"'));
  });

  it("makes the game type the smaller, quiet pill", async () => {
    // Act
    const html = renderToStaticMarkup(await CardBadges({ format: "6v6", surface: "indoor", layout: "card" }));

    // Assert
    const surface = tag(html, "game-surface");
    expect(surface).not.toContain("h-7");
    expect(surface).not.toContain("bg-cloud");
  });

  it("centres the languages under the game type", async () => {
    // Act
    const html = renderToStaticMarkup(
      await CardBadges({ format: "6v6", surface: "indoor", language: "en", layout: "card" }),
    );

    // Assert
    const cell = html.match(/<div[^>]*data-testid="card-badges-type"[^>]*>(.*?)<\/div>/)?.[0] ?? "";
    expect(cell).toContain("items-center");
    expect(cell).toContain('data-testid="game-surface"');
    expect(cell.indexOf('data-testid="language-pill"')).toBeGreaterThan(cell.indexOf('data-testid="game-surface"'));
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
