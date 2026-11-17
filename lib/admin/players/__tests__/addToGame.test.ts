import { describe, expect, it } from "vitest";
import { addToGameOptions } from "@/lib/admin/players/addToGame";

/**
 * The games an admin can add a player to (owner, 17 Nov 2026: "add them to an upcoming game"): published or full,
 * not started, soonest first. A game the player is already in, or a full one, is listed but cannot be picked, so
 * the admin sees why it is missing rather than wondering.
 */
const NOW = new Date("2026-11-17T05:00:00Z");
const game = (id: string, startsAt: string, status: string, capacity: number, activeCount: number) => ({
  id,
  venue: `Venue ${id}`,
  starts_at: startsAt,
  status,
  capacity,
  activeCount,
});

describe("addToGameOptions", () => {
  it("lists only published or full games that have not started, soonest first", () => {
    // Arrange
    const games = [
      game("late", "2026-11-20T12:00:00Z", "published", 18, 3),
      game("past", "2026-11-16T12:00:00Z", "published", 18, 3),
      game("draft", "2026-11-18T12:00:00Z", "draft", 18, 0),
      game("cancelled", "2026-11-18T12:00:00Z", "cancelled", 18, 0),
      game("soon", "2026-11-18T12:00:00Z", "full", 2, 2),
    ];

    // Act
    const options = addToGameOptions(games, [], NOW);

    // Assert
    expect(options.map((o) => o.id)).toEqual(["soon", "late"]);
  });

  it("marks a game the player is already in, and a full one, as not pickable", () => {
    // Arrange
    const games = [
      game("in", "2026-11-18T12:00:00Z", "published", 18, 1),
      game("full", "2026-11-19T12:00:00Z", "full", 2, 2),
      game("open", "2026-11-20T12:00:00Z", "published", 18, 5),
    ];

    // Act
    const options = addToGameOptions(games, ["in"], NOW);

    // Assert
    expect(options.map((o) => [o.id, o.disabledReason])).toEqual([
      ["in", "alreadyIn"],
      ["full", "full"],
      ["open", null],
    ]);
  });

  it("counts the spots left", () => {
    // Act
    const [option] = addToGameOptions([game("open", "2026-11-20T12:00:00Z", "published", 18, 5)], [], NOW);

    // Assert
    expect(option!.spotsLeft).toBe(13);
  });
});
