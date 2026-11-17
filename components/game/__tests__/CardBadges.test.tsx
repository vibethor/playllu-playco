import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { strings } from "@/lib/strings";

vi.mock("@/lib/i18n/server", () => ({ getStrings: async () => strings, getLocale: async () => "en" }));

const { CardBadges } = await import("@/components/game/CardBadges");

const tag = (html: string, testId: string) => html.match(new RegExp(`<span[^>]*data-testid="${testId}"[^>]*>`))?.[0] ?? "";

/**
 * THE CARD SAYS INDOOR OR BEACH (owner, 17 Nov 2026: "on the game card it should say if it's indoor or beach
 * volleyball with a tag"), AND THE FORMAT AGAIN, SMALL (owner, later the same day: "I can't see the format if it's
 * 6v6 or 5v5 … add the format below the languages, like a small pill").
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

  it("shows the format as a small pill under the language", async () => {
    // Act
    const html = renderToStaticMarkup(
      await CardBadges({ format: "6v6", surface: "indoor", language: "en", layout: "card" }),
    );

    // Assert
    expect(tag(html, "game-format")).not.toBe("");
    expect(html).toContain("6v6");
    expect(html.indexOf('data-testid="game-format"')).toBeGreaterThan(html.indexOf('data-testid="game-surface"'));
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
