import { describe, expect, it } from "vitest";
import { normaliseReferralCode } from "@/lib/referrals/code";

/**
 * What a person types into "Referral code": six characters from an alphabet without 0/O and 1/I/L. Typing is
 * forgiving (lowercase, spaces, a dash), the stored form is strict, and an empty box is simply no code.
 */
describe("normaliseReferralCode", () => {
  it("treats an empty box as no code", () => {
    // Act / Assert
    expect(normaliseReferralCode("   ")).toEqual({ ok: true, code: null });
  });

  it("accepts lowercase, spaces and a dash", () => {
    // Act / Assert
    expect(normaliseReferralCode(" k7m-2qx ")).toEqual({ ok: true, code: "K7M2QX" });
  });

  it("refuses the wrong length", () => {
    // Act / Assert
    expect(normaliseReferralCode("K7M2Q")).toEqual({ ok: false });
  });

  it("refuses characters that are never in a code (0, O, 1, I, L)", () => {
    // Act / Assert
    expect(normaliseReferralCode("K7M2Q0")).toEqual({ ok: false });
  });
});
