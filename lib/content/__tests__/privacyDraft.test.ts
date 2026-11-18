import { describe, expect, it } from "vitest";
import { LEGAL_JURISDICTION, SITE_NAME } from "@/lib/city/default";
import { legalDraftText } from "@/lib/content/legalDraft";
import { privacyDraft } from "@/lib/content/privacyDraft";
import { OPERATOR_CONTACT, PRIVACY_VERSION } from "@/lib/legal";

/**
 * Playco's English privacy policy (Jachym, 18 Nov 2026), on the logic of HrajFotbal's Czech one and Thailand's PDPA.
 * It describes who sees what as the app's roles actually allow it (CLAUDE.md §1, rules 6, 8 and 11).
 */

describe("Playco's privacy policy", () => {
  it("names the controller and the address for personal-data requests", () => {
    // Act
    const text = legalDraftText(privacyDraft({ analytics: false }));

    // Assert
    expect(text).toContain(`${SITE_NAME} (“${SITE_NAME}”, “we”) is the data controller`);
    expect(text).toContain(OPERATOR_CONTACT.privacyEmail);
  });

  it("names no private person (Jachym, 18 Nov 2026: keep it under Playco)", () => {
    // Act
    const text = legalDraftText(privacyDraft({ analytics: true }));

    // Assert
    expect(text).not.toMatch(/Jachym|Thor\b|trading as/);
  });

  it("follows the data protection law of the country the games are played in", () => {
    // Act
    const text = legalDraftText(privacyDraft({ analytics: false }));

    // Assert
    expect(text).toContain(LEGAL_JURISDICTION.dataProtectionLaw);
    expect(text).toContain(LEGAL_JURISDICTION.dataProtectionAuthority);
  });

  it("says who sees phone numbers and that email stays with the platform", () => {
    // Act
    const text = legalDraftText(privacyDraft({ analytics: false }));

    // Assert
    expect(text).toContain("city manager");
    expect(text).toContain("Your email address is seen only by");
  });

  it("mentions analytics and advertising measurement only while they run", () => {
    // Act
    const off = legalDraftText(privacyDraft({ analytics: false }));
    const on = legalDraftText(privacyDraft({ analytics: true }));

    // Assert
    expect(off).not.toContain("Google Analytics");
    expect(on).toContain("Google Analytics");
    expect(on).toContain("Meta");
  });

  it("prints the version stamped onto every acceptance", () => {
    // Act
    const draft = privacyDraft({ analytics: false });

    // Assert
    expect(draft.meta).toContain(`version ${PRIVACY_VERSION}`);
  });

  it("carries nothing over from the Czech policy", () => {
    // Act
    const text = legalDraftText(privacyDraft({ analytics: true }));

    // Assert
    expect(text).not.toMatch(/Czech|HrajFotbal|Hraj Fotbal|GDPR|Úřad/i);
  });
});
