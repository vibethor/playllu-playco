import { describe, expect, it } from "vitest";
import { CONSENT_COOKIE } from "@/lib/consent";
import { LOCALE_COOKIE } from "@/lib/i18n/locales";
import { PENDING_PURCHASE_COOKIE } from "@/lib/payments/pendingPurchase";
import { cookiePolicyDraft } from "@/lib/content/cookiePolicyDraft";

/**
 * The English cookie policy draft (Jachym, 17 Nov 2026: "generate a cookie text in English for now, and just put it
 * on the website. I will have my lawyer review it later"). The table has to name the cookies the code really sets.
 */
const names = (analytics: boolean) =>
  cookiePolicyDraft({ analytics }).categories.flatMap((category) => category.cookies.map((cookie) => cookie.name));

describe("the cookie policy draft", () => {
  it("names the necessary cookies the site sets, by the names the code uses", () => {
    // Act
    const listed = names(false);

    // Assert
    expect(listed).toEqual(expect.arrayContaining([CONSENT_COOKIE, LOCALE_COOKIE, PENDING_PURCHASE_COOKIE]));
  });

  it("lists Google Analytics and the Meta Pixel while the tag manager is configured", () => {
    // Act
    const listed = names(true);

    // Assert
    expect(listed).toEqual(expect.arrayContaining(["_ga", "_fbp"]));
  });

  it("lists no analytics or marketing cookie while the tag manager is off", () => {
    // Act
    const categories = cookiePolicyDraft({ analytics: false }).categories.map((category) => category.id);

    // Assert
    expect(categories).toEqual(["necessary"]);
  });

  it("says plainly that it is a draft awaiting legal review", () => {
    // Act
    const draft = cookiePolicyDraft({ analytics: true });

    // Assert
    expect(draft.status).toMatch(/draft/i);
    expect(draft.status).toMatch(/review/i);
  });
});
