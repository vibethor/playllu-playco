import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { strings } from "@/lib/strings";

vi.mock("@/lib/i18n/server", () => ({ getStrings: async () => strings, getLocale: async () => "en" }));
vi.mock("@/lib/storage/photoVersions", () => ({ venuePhotoVersion: async () => null }));

const { GameCard } = await import("@/components/game/GameCard");
const { CardBadges } = await import("@/components/game/CardBadges");

/** Every element in a rendered tree. The card's badges are an async component, so the tree is walked, not rendered. */
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children as ReactNode)];
}

/**
 * NO LANGUAGES ON THE CARD (owner, 17 Nov 2026): "remove the languages from the game card. I don't think we need it at
 * the moment … just keep it in the game information once you click on it". The game page draws its own language pill.
 */
describe("GameCard", () => {
  it("does not hand the game's languages to the card's badges", async () => {
    // Arrange
    const game = {
      id: "game-1",
      game_number: 1,
      venue: "Swish Elite 50",
      starts_at: "2026-11-20T11:00:00Z",
      capacity: 18,
      format: "6v6v6",
      surface: "indoor" as const,
      duration_minutes: 120,
      language: "en-th",
    };

    // Act
    const card = await GameCard({ game, bookedCount: 0 });

    // Assert
    const badges = elements(card).filter((el) => el.type === CardBadges);
    expect(badges).toHaveLength(1);
    expect(badges[0]?.props).not.toHaveProperty("language");
  });
});
