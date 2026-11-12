import { describe, expect, it } from "vitest";
import { revenueMix } from "@/lib/admin/money/revenueMix";
import type { BookingSeatValue } from "@/lib/types/database";

/**
 * Revenue by how it was paid (round 42, the admin rebuild). The owner: "we
 * also need to distinguish between someone purchasing a single credit or using
 * a credit from a game pass that'd make their entry cheaper". Every booking's
 * worth comes from SQL (`booking_seat_values`); this only adds it up and works
 * out what the cheaper pass entry cost him.
 */
function booking(overrides: Partial<BookingSeatValue>): BookingSeatValue {
  return {
    booking_id: "b",
    game_id: "g1",
    player_id: "p",
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

const PRICES = new Map([
  ["g1", 180],
  ["g2", 200],
]);

describe("revenueMix", () => {
  it("adds up single-game, Game Pass and other Credit seats separately", () => {
    // Arrange
    const values = [
      booking({ booking_id: "b1", single_seats: 2, single_thb: 360, seats: 2 }),
      booking({ booking_id: "b2", pass_seats: 1, pass_thb: 150 }),
      booking({ booking_id: "b3", credit_seats: 1, credit_thb: 180 }),
    ];

    // Act
    const mix = revenueMix(values, PRICES);

    // Assert
    expect(mix.single).toEqual({ seats: 2, thb: 360 });
    expect(mix.pass).toEqual({ seats: 1, thb: 150 });
    expect(mix.credit).toEqual({ seats: 1, thb: 180 });
  });

  it("counts money kept from late cancellations, and how many cancellations kept it", () => {
    // Arrange
    const values = [
      booking({ booking_id: "b1", status: "cancelled", seats: 0, kept_thb: 180 }),
      booking({ booking_id: "b2", status: "cancelled", seats: 0, kept_thb: 0 }),
      booking({ booking_id: "b3", single_seats: 1, single_thb: 180 }),
    ];

    // Act
    const mix = revenueMix(values, PRICES);

    // Assert
    expect(mix.kept).toEqual({ thb: 180, cancellations: 1 });
    expect(mix.totalThb).toBe(360);
  });

  it("works out the average a seat brought, single against pass", () => {
    // Arrange — five games for 750 is 150 a pass seat.
    const values = [
      booking({ booking_id: "b1", single_seats: 2, single_thb: 360 }),
      booking({ booking_id: "b2", pass_seats: 3, pass_thb: 450 }),
    ];

    // Act
    const mix = revenueMix(values, PRICES);

    // Assert
    expect(mix.avgSingleThb).toBe(180);
    expect(mix.avgPassThb).toBe(150);
    expect(mix.passGapPerSeatThb).toBe(30);
  });

  it("has no average for a kind nobody paid with", () => {
    // Arrange
    const values = [booking({ single_seats: 1, single_thb: 180 })];

    // Act
    const mix = revenueMix(values, PRICES);

    // Assert
    expect(mix.avgPassThb).toBeNull();
    expect(mix.passGapPerSeatThb).toBeNull();
  });

  it("prices the pass discount against each game's own price", () => {
    // Arrange — two pass seats on a 180 game and one on a 200 game, at 150 each.
    const values = [
      booking({ booking_id: "b1", game_id: "g1", pass_seats: 2, pass_thb: 300 }),
      booking({ booking_id: "b2", game_id: "g2", pass_seats: 1, pass_thb: 150 }),
    ];

    // Act
    const mix = revenueMix(values, PRICES);

    // Assert — (2 × 180 − 300) + (1 × 200 − 150)
    expect(mix.passGapTotalThb).toBe(110);
  });

  it("counts free seats — gifts and seed bookings — without adding money", () => {
    // Arrange
    const values = [booking({ free_seats: 2, seats: 2 })];

    // Act
    const mix = revenueMix(values, PRICES);

    // Assert
    expect(mix.freeSeats).toBe(2);
    expect(mix.totalThb).toBe(0);
  });
});
