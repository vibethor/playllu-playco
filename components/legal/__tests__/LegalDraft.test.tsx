import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LegalDraft } from "@/components/legal/LegalDraft";
import type { LegalDraft as Draft } from "@/lib/content/legalDraft";
import { LEGACY_TERMS_RULES_ANCHOR, TERMS_RULES_ANCHOR } from "@/lib/legal";

/**
 * THE RULES ANCHOR WAS RENAMED, AND THE OLD ONE STILL LANDS (24 Nov 2026). Booking emails already in inboxes
 * link to `/terms#pravidla`; a link in a sent email cannot be corrected.
 */
function draftWith(sectionId: string): Draft {
  return {
    meta: "Effective from 18 November 2026",
    sections: [{ id: sectionId, heading: "Annex: Community and game rules", paragraphs: ["Fair play."] }],
  };
}

describe("the rules annex's anchors on the terms page", () => {
  it("answers to its English name", () => {
    // Act
    const markup = renderToStaticMarkup(<LegalDraft draft={draftWith(TERMS_RULES_ANCHOR)} />);

    // Assert
    expect(markup).toContain(`<h2 id="${TERMS_RULES_ANCHOR}"`);
  });

  it("still answers to the name the emails already sent link to", () => {
    // Act
    const markup = renderToStaticMarkup(<LegalDraft draft={draftWith(TERMS_RULES_ANCHOR)} />);

    // Assert
    expect(markup).toContain(`id="${LEGACY_TERMS_RULES_ANCHOR}"`);
  });

  it("puts the old name on the rules only, not on every section", () => {
    // Act
    const markup = renderToStaticMarkup(<LegalDraft draft={draftWith("payments")} />);

    // Assert
    expect(markup).not.toContain(`id="${LEGACY_TERMS_RULES_ANCHOR}"`);
  });
});
