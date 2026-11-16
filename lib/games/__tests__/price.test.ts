import { describe, expect, it } from "vitest";
import { priceForDurationThb } from "@/lib/games/price";
import { PASS_REFERENCE_PRICE_THB } from "@/lib/pass/creditPrice";

/**
 * ROUND 40 — a game is one Credit, whatever its length.
 *
 * ~~Round 35 v5: sixty minutes is 150, ninety is 180, and a credit buys only a
 * ninety-minute seat.~~ The owner removed the 150 THB hour, and the terms
 * (Obchodní podmínky 5.1) make every booking a Credit — so the price the admin
 * form prefills is the Credit price for every length.
 */
describe("priceForDurationThb", () => {
  it("prefills one Credit's price for every length", () => {
    // Arrange
    const lengths = [60, 90, 120, 75, null, undefined];

    // Act
    const prices = lengths.map((minutes) => priceForDurationThb(minutes));

    // Assert
    expect(prices).toEqual(lengths.map(() => PASS_REFERENCE_PRICE_THB));
  });

  it("is the standard Bangkok game's 250 THB", () => {
    // Arrange
    const standardMinutes = 120;

    // Act
    const price = priceForDurationThb(standardMinutes);

    // Assert
    expect(price).toBe(250);
  });

  it("prefills 300 THB for a game longer than two hours (the Sunday 3-hour game)", () => {
    // Arrange
    const sundayMinutes = 180;

    // Act
    const price = priceForDurationThb(sundayMinutes);

    // Assert
    expect(price).toBe(300);
  });
});
