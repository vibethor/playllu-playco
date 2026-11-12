import { describe, expect, it } from "vitest";
import { adminWallet, creditsFromThb, thbFromCredits, isWholeCredits } from "@/lib/admin/credits";
import { PASS_REFERENCE_PRICE_THB } from "@/lib/pass/creditPrice";

/**
 * ROUND 31, ITEM 3 — admin counts credits, the ledger keeps crowns.
 */

/*
 * ~~150.~~ THE RATE IS 180 SINCE ROUND 35 v2, and these are written as the
 * CONSTANT rather than as literals wherever the literal would only be restating
 * it. The two that stay literal are the ones whose point IS the number: a
 * balance that does not divide, and the floor.
 */
const RATE = PASS_REFERENCE_PRICE_THB;

describe("thbFromCredits", () => {
  it("converts whole credits at the ruling's rate", () => {
    expect(thbFromCredits(2)).toBe(2 * RATE);
    expect(thbFromCredits(1)).toBe(RATE);
  });

  it("is the ruling's constant, not a literal of its own", () => {
    /*
     * A SECOND COPY OF 150 IS THE BUG THIS GUARDS. The rate lives in
     * `PASS_REFERENCE_PRICE_THB` and the whole product divides by it; a
     * hard-coded 150 here would keep passing on the day the price moves.
     */
    expect(thbFromCredits(1)).toBe(PASS_REFERENCE_PRICE_THB);
    expect(thbFromCredits(7)).toBe(7 * PASS_REFERENCE_PRICE_THB);
  });
});

describe("creditsFromThb", () => {
  it("counts whole credits a player can actually spend", () => {
    expect(creditsFromThb(3 * RATE)).toBe(3);
    expect(creditsFromThb(RATE)).toBe(1);
    expect(creditsFromThb(0)).toBe(0);
  });

  it("FLOORS rather than rounds — a part credit buys no game", () => {
    /*
     * 149 THB is not "one credit". Rounding up states a number the player
     * cannot spend, which is worse than stating a smaller true one.
     */
    expect(creditsFromThb(RATE - 1)).toBe(0);
    expect(creditsFromThb(2 * RATE - 1)).toBe(1);
    // A ragged legacy balance, floored to what it can actually buy.
    expect(creditsFromThb(4460)).toBe(24);
  });

  it("never goes negative", () => {
    expect(creditsFromThb(-RATE)).toBe(0);
  });
});

describe("isWholeCredits", () => {
  it("recognises a clean balance", () => {
    expect(isWholeCredits(0)).toBe(true);
    expect(isWholeCredits(2 * RATE)).toBe(true);
  });

  it("recognises a balance that does not divide", () => {
    /*
     * ~~"the ragged ones that exist on production today".~~ NONE DO ANY MORE —
     * round 35 v2 zeroed every wallet, which is what closed row 244. These are
     * kept as arithmetic rather than as a census: the function must still be
     * right the first time somebody is granted an odd amount by hand.
     */
    for (const balance of [4460, 110, 50]) {
      expect(isWholeCredits(balance), `${balance} read as clean`).toBe(false);
    }
  });
});

describe("adminWallet", () => {
  it("shows credits alone when the balance divides cleanly", () => {
    expect(adminWallet(3 * RATE)).toEqual({ credits: 3, remainderThb: null });
    expect(adminWallet(0)).toEqual({ credits: 0, remainderThb: null });
  });

  it("HANDLES THE RAGGED BALANCE INSTEAD OF ROUNDING A LIE", () => {
    /*
     * The headline is a floor, so the difference is real money the organizer
     * has to be able to see. `remainderThb` is what the surface prints as
     * subtext — never instead of the credit count, always beside it.
     */
    expect(adminWallet(4460)).toEqual({ credits: 24, remainderThb: 4460 });
    expect(adminWallet(110)).toEqual({ credits: 0, remainderThb: 110 });
    expect(adminWallet(50)).toEqual({ credits: 0, remainderThb: 50 });
  });

  it("round-trips a granted amount back to the credits that were typed", () => {
    for (const credits of [1, 2, 3, 10]) {
      expect(adminWallet(thbFromCredits(credits))).toEqual({ credits, remainderThb: null });
    }
  });
});
