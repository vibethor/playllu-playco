import { expect, test, type BrowserContext } from "@playwright/test";
import { LOCALE_COOKIE } from "../lib/i18n/locales";
import { OPERATOR_CONTACT, TERMS_RULES_ANCHOR, TERMS_VERSION } from "../lib/legal";

/**
 * PLAYCO'S OWN ENGLISH TERMS AND PRIVACY POLICY (18 Nov 2026).
 *
 * The WORDS are proven by `lib/content/__tests__/termsDraft.test.ts` and `privacyDraft.test.ts`. This file proves
 * what only a browser can: the pages are reachable, the language notice appears for exactly the readers it is for,
 * the rules annex is where signup links to, and the page does not scroll sideways on a phone.
 *
 * Every assertion waits on `legal-document`, which only the real page renders — the root `loading.tsx` makes
 * `page.goto` resolve while a skeleton is up.
 */

test.use({ viewport: { width: 390, height: 844 } });

async function useLocale(context: BrowserContext, locale: "cs" | "en" | "th") {
  await context.addCookies([{ name: LOCALE_COOKIE, value: locale, domain: "localhost", path: "/" }]);
}

test("the terms are Playco's English document, with its rules annex", async ({ page, context }) => {
  // Arrange
  await useLocale(context, "en");

  // Act
  await page.goto(`/terms#${TERMS_RULES_ANCHOR}`);

  // Assert
  await expect(page.getByTestId("legal-document")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Terms and conditions" })).toBeVisible();
  await expect(page.getByTestId("legal-meta")).toContainText(`version ${TERMS_VERSION}`);
  await expect(page.locator(`#${TERMS_RULES_ANCHOR}`)).toHaveText("Annex: Community and game rules");
  await expect(page.getByTestId("legal-language-notice")).toHaveCount(0);
});

test("a reader of another language is told the document is in English", async ({ page, context }) => {
  // Arrange
  await useLocale(context, "th");

  // Act
  await page.goto("/privacy");

  // Assert
  await expect(page.getByTestId("legal-document")).toBeVisible();
  await expect(page.getByTestId("legal-language-notice")).toBeVisible();
});

test("the privacy page names the address for personal-data requests", async ({ page }) => {
  // Act
  await page.goto("/privacy");

  // Assert
  await expect(page.getByTestId("legal-document")).toContainText(OPERATOR_CONTACT.privacyEmail);
  await expect(page.locator("body")).not.toContainText(/hrajfotbal/i);
});

test("the privacy page does not scroll sideways on a phone", async ({ page }) => {
  // Act
  await page.goto("/privacy");
  await expect(page.getByTestId("legal-document")).toBeVisible();

  // Assert
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

/*
 * ~~"…and the operator"~~ — the operator block left every page on 2026-10-27
 * (owner's ruling; Obchodní podmínky 1.2 carries it). This pins the removal.
 */
test("the footer carries the four legal links and no operator block", async ({ page, context }) => {
  // Arrange
  await useLocale(context, "cs");

  // Act
  await page.goto("/games");
  const footer = page.getByTestId("site-footer");
  await footer.scrollIntoViewIfNeeded();

  // Assert
  for (const href of ["/terms", "/privacy", "/cookies", "/contact"]) {
    await expect(footer.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
  await expect(page.getByTestId("footer-operator")).toHaveCount(0);
  await expect(footer).not.toContainText("Provozovatel");
  await expect(footer).not.toContainText("Česká obchodní inspekce");
  await expect(footer).not.toContainText("support@hrajfotbal.com");
  await expect(footer).toContainText("© Playllu");
  await expect(footer).not.toContainText(/hrajsport/i);
});

/*
 * ~~"the home page says who is, and is not, on the pitch"~~ — the owner removed
 * the lawyer's item 1.4 note from the home page on 2026-10-27. The message
 * still reaches every player at sign-up and at booking; this pins the removal.
 */
test("the home page no longer carries the who-is-on-the-pitch note", async ({ page, context }) => {
  // Arrange
  await useLocale(context, "cs");

  // Act
  await page.goto("/");
  await expect(page.getByTestId("how-it-works")).toBeVisible();

  // Assert
  await expect(page.getByTestId("how-it-works-note")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Zápasy ale neorganizujeme", { useInnerText: true });
});
