import { describe, expect, it } from "vitest";
import { creditedBecauseGameFilled } from "@/lib/payments/creditReason";

/*
 * Why a checkout payment became credit, read off `checkout_sessions.attention_reason` (written by
 * `settle_checkout_session`). The receipt only says "the game filled while you were paying" when that is what happened;
 * a player who paid twice for a spot they already had (18 Nov 2026) gets a plain credit receipt.
 */
describe("creditedBecauseGameFilled", () => {
  it("is true when the game filled while they paid", () => {
    // Arrange
    const reason = "paid 300 THB for booking after the game filled — credited in full";

    // Act
    const filled = creditedBecauseGameFilled(reason);

    // Assert
    expect(filled).toBe(true);
  });

  it("is false when they already held a spot", () => {
    // Arrange
    const reason = "paid 300 THB for booking while already holding a spot — credited in full";

    // Act
    const filled = creditedBecauseGameFilled(reason);

    // Assert
    expect(filled).toBe(false);
  });

  it("keeps the old wording when no reason was recorded", () => {
    // Arrange
    const reason = null;

    // Act
    const filled = creditedBecauseGameFilled(reason);

    // Assert
    expect(filled).toBe(true);
  });
});
