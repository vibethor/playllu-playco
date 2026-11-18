import { describe, expect, it } from "vitest";
import { LEGAL_JURISDICTION, SITE_NAME } from "@/lib/city/default";
import { legalDraftText } from "@/lib/content/legalDraft";
import { termsDraft } from "@/lib/content/termsDraft";
import { OPERATOR_CONTACT, TERMS_RULES_ANCHOR, TERMS_VERSION } from "@/lib/legal";
import { policy } from "@/lib/policy";

/**
 * Playco's English terms (Jachym, 18 Nov 2026), written on the logic of HrajFotbal's Czech terms. These tests hold the
 * text to what the app actually does: the numbers come from the same policy values the database mirrors, so the terms
 * cannot promise a refund window or a pass validity the code does not keep.
 */

const TWELVE_HOURS = 12;
const EIGHT_HOURS = 8;

describe("Playco's terms", () => {
  it("states the refund cutoff the database enforces", () => {
    // Arrange
    const facts = { refundCutoffHours: TWELVE_HOURS };

    // Act
    const text = legalDraftText(termsDraft(facts));

    // Assert
    expect(text).toContain(`at least ${TWELVE_HOURS} hours before the start`);
  });

  it("follows the cutoff when the database moves it", () => {
    // Arrange
    const facts = { refundCutoffHours: EIGHT_HOURS };

    // Act
    const text = legalDraftText(termsDraft(facts));

    // Assert
    expect(text).toContain(`at least ${EIGHT_HOURS} hours before the start`);
    expect(text).not.toContain(`at least ${TWELVE_HOURS} hours before the start`);
  });

  it("gives pass credits the validity the database applies", () => {
    // Act
    const text = legalDraftText(termsDraft({ refundCutoffHours: TWELVE_HOURS }));

    // Assert
    expect(text).toContain(`valid for ${policy.credits.validityDays} days from the day you buy the pass`);
    expect(text).toContain(`extended by ${policy.credits.cancelledGameExtensionDays} days`);
  });

  it("presents the business as Playco, with how to reach it", () => {
    // Act
    const text = legalDraftText(termsDraft({ refundCutoffHours: TWELVE_HOURS }));

    // Assert
    expect(text).toContain(`${SITE_NAME} (“${SITE_NAME}”, “we”, “us”)`);
    expect(text).toContain(OPERATOR_CONTACT.email);
  });

  it("names no private person (Jachym, 18 Nov 2026: keep it under Playco)", () => {
    // Act
    const text = legalDraftText(termsDraft({ refundCutoffHours: TWELVE_HOURS }));

    // Assert
    expect(text).not.toMatch(/Jachym|Thor\b|trading as/);
  });

  it("puts the community rules where signup and the booking emails link to", () => {
    // Act
    const ids = termsDraft({ refundCutoffHours: TWELVE_HOURS }).sections.map((section) => section.id);

    // Assert
    expect(ids).toContain(TERMS_RULES_ANCHOR);
  });

  it("prints the version stamped onto every acceptance", () => {
    // Act
    const draft = termsDraft({ refundCutoffHours: TWELVE_HOURS });

    // Assert
    expect(draft.meta).toContain(`version ${TERMS_VERSION}`);
  });

  it("is governed by the law of the country the games are played in", () => {
    // Act
    const text = legalDraftText(termsDraft({ refundCutoffHours: TWELVE_HOURS }));

    // Assert
    expect(text).toContain(LEGAL_JURISDICTION.governingLaw);
    expect(text).toContain(LEGAL_JURISDICTION.emergencyNumber);
  });

  it("keeps liability the law does not allow us to exclude", () => {
    // Act
    const text = legalDraftText(termsDraft({ refundCutoffHours: TWELVE_HOURS }));

    // Assert
    expect(text).toContain("death or personal injury caused by our negligence");
  });

  it("carries nothing over from the Czech football terms", () => {
    // Act
    const text = legalDraftText(termsDraft({ refundCutoffHours: TWELVE_HOURS }));

    // Assert
    expect(text).not.toMatch(/Czech|HrajFotbal|Hraj Fotbal|Občansk|football/i);
  });

  it("gives every section a unique anchor", () => {
    // Act
    const ids = termsDraft({ refundCutoffHours: TWELVE_HOURS }).sections.map((section) => section.id);

    // Assert
    expect(new Set(ids).size).toBe(ids.length);
  });
});
