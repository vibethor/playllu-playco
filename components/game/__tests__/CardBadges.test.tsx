import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { strings } from "@/lib/strings";

vi.mock("@/lib/i18n/server", () => ({ getStrings: async () => strings, getLocale: async () => "en" }));

const { CardBadges } = await import("@/components/game/CardBadges");

/**
 * THE CARD SAYS INDOOR OR BEACH, NOT THE FORMAT (owner, 17 Nov 2026): "on the game card it should say if it's
 * indoor or beach volleyball with a tag"; the format ("5v5" on a three-team rotation) belongs on the game page.
 */
describe("CardBadges on a list card", () => {
  it("shows the game type as the card's tag", async () => {
    // Act
    const html = renderToStaticMarkup(await CardBadges({ format: "5v5", surface: "sand", layout: "card" }));

    // Assert
    expect(html).toContain('data-testid="game-surface"');
    expect(html).toContain(strings.games.surface.sand);
  });

  it("leaves the format to the game page", async () => {
    // Act
    const html = renderToStaticMarkup(await CardBadges({ format: "5v5", surface: "indoor", layout: "card" }));

    // Assert
    expect(html).not.toContain('data-testid="game-format"');
    expect(html).not.toContain("5v5");
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
