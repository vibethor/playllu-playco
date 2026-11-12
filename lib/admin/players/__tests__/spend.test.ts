import { describe, expect, it } from "vitest";
import { playerSpend } from "@/lib/admin/players/spend";
import type { BookingSeatValue } from "@/lib/types/database";

/**
 * What one player has paid (round 42), valued the way the games' economics
 * value it: a single game at its price, a Game Pass Credit at what the pass
 * cost per game, other Credit at what was paid for it, gifts at nothing — and
 * what a late cancellation kept.
 */

function value(overrides: Partial<BookingSeatValue>): BookingSeatValue {
  return {
    booking_id: "b",
    game_id: "g",
    player_id: "p1",
    status: "confirmed",
    seats: 1,
    single_seats: 0,
    pass_seats: 0,
    credit_seats: 0,
    free_seats: 0,
    unpaid_seats: 0,
    single_thb: 0,
    pass_thb: 0,
    credit_thb: 0,
    kept_thb: 0,
    owed_thb: 0,
    ...overrides,
  };
}

describe("playerSpend", () => {
  it("adds up each way this player paid, and the total", () => {
    // Arrange
    const values = [
      value({ booking_id: "b1", single_thb: 180 }),
      value({ booking_id: "b2", pass_thb: 150 }),
      value({ booking_id: "b3", credit_thb: 180 }),
      value({ booking_id: "b4", status: "cancelled", kept_thb: 90 }),
    ];

    // Act
    const spend = playerSpend(values, "p1");

    // Assert
    expect(spend).toEqual({ singleThb: 180, passThb: 150, creditThb: 180, keptThb: 90, totalThb: 600 });
  });

  it("ignores everybody else's bookings on the same games", () => {
    const spend = playerSpend([value({ player_id: "p2", single_thb: 180 })], "p1");
    expect(spend.totalThb).toBe(0);
  });

  it("rounds pass values to whole crowns, as the money is shown", () => {
    const spend = playerSpend([value({ pass_thb: 149.6 }), value({ pass_thb: 149.6 })], "p1");
    expect(spend).toMatchObject({ passThb: 299, totalThb: 299 });
  });
});
