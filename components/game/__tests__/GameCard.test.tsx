import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { strings } from "@/lib/strings";

vi.mock("@/lib/i18n/server", () => ({ getStrings: async () => strings, getLocale: async () => "en" }));
vi.mock("@/lib/storage/photoVersions", () => ({
  venuePhotoVersion: async () => null,
  profilePhotoVersion: async () => null,
}));

const { GameCard } = await import("@/components/game/GameCard");
const { CardBadges } = await import("@/components/game/CardBadges");
const { CapacityBar } = await import("@/components/game/CapacityBar");
const { AvatarRow } = await import("@/components/game/AvatarRow");

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

  /*
   * THE FACES UNDER THE BAR (owner, 17 Nov 2026, with a phone screenshot): "move it below the progress bar. So make
   * the game card a tiny bit bigger so there is enough space … so it doesn't look too stacked … Maybe make them a bit
   * smaller as well."
   */
  const GAME = {
    id: "game-2",
    game_number: 2,
    venue: "Swish Elite 50",
    starts_at: "2026-11-20T11:00:00Z",
    capacity: 18,
    format: "6v6",
    surface: "indoor" as const,
    duration_minutes: 120,
  };
  const PLAYER = { nickname: "Steven", photoPath: null, isGuest: false, guestOf: null, guestIndex: null };

  it("shows the players' faces on their own row under the capacity bar", async () => {
    // Arrange
    const roster = [PLAYER, { ...PLAYER, nickname: "Sofi" }];

    // Act
    const tree = elements(await GameCard({ game: GAME, bookedCount: 2, roster }));

    // Assert
    const faces = tree.find((el) => el.props["data-testid"] === "card-faces");
    expect(faces).toBeDefined();
    expect(elements(faces?.props.children as ReactNode).some((el) => el.type === AvatarRow)).toBe(true);
    expect(tree.findIndex((el) => el.type === CapacityBar)).toBeLessThan(tree.findIndex((el) => el.type === AvatarRow));
  });

  it("keeps the faces row when nobody has joined, so every card stays one height", async () => {
    // Act
    const tree = elements(await GameCard({ game: GAME, bookedCount: 0, roster: [] }));

    // Assert
    const faces = tree.find((el) => el.props["data-testid"] === "card-faces");
    expect(faces).toBeDefined();
    expect(tree.some((el) => el.type === AvatarRow)).toBe(false);
  });
});
