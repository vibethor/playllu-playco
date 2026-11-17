import Link from "next/link";
import { CookiePolicyDraft } from "@/components/legal/CookiePolicyDraft";
import { gtmEnabled } from "@/lib/analytics/gtm";
import { cookiePolicyDraft } from "@/lib/content/cookiePolicyDraft";
import { OPERATOR_CONTACT } from "@/lib/legal";
import type { LegalDocumentName } from "@/lib/content/legalDocuments";
import { getStrings } from "@/lib/i18n/server";

/**
 * The shell shared by `/terms`, `/privacy` and `/cookies`.
 *
 * The furniture is translated and the document is not: a non-Czech reader is
 * told, in their language and above the text, that the Czech version binds.
 * Czech readers get no notice — for them it would only say the obvious.
 */
export async function LegalPage({
  name,
  pdfHref,
  annexAnchor,
}: {
  name: LegalDocumentName;
  pdfHref?: string;
  annexAnchor?: string;
}) {
  const t = await getStrings();

  /*
   * PLAYCO: THE INHERITED DOCUMENTS ARE NOT SHOWN. They are HrajFotbal's Czech terms (a Czech seller, Czech law).
   * Until Jachym's lawyer has written the Thai versions, every legal page shows its title and a review notice — no
   * legal text is invented here. The documents, the loader and the view stay in the code for when the new texts
   * arrive (TODO.md).
   */
  void pdfHref;
  void annexAnchor;
  const title = { terms: t.legal.termsTitle, privacy: t.legal.privacyTitle, cookies: t.legal.cookiesTitle }[name];
  /*
   * THE COOKIE POLICY IS AN ENGLISH DRAFT (Jachym, 17 Nov 2026), shown so the page explains the banner while the
   * lawyer reviews it. Terms and privacy keep the review notice: no legal text is invented for them.
   */
  if (name === "cookies") {
    return (
      <main className="relative z-10 mx-auto w-full max-w-content px-gutter pb-16 pt-24">
        <h1 className="m-0 font-display text-page-title font-bold text-bone">{title}</h1>
        <CookiePolicyDraft draft={cookiePolicyDraft({ analytics: gtmEnabled() })} />
        <Link
          href="/games"
          className="mt-10 inline-flex min-h-11 items-center text-small text-faint no-underline hover:text-accent-dim"
        >
          {t.legal.back}
        </Link>
      </main>
    );
  }
  return (
    <main className="relative z-10 mx-auto w-full max-w-content px-gutter pb-16 pt-24">
      <h1 className="m-0 font-display text-page-title font-bold text-bone">{title}</h1>
      <p role="note" data-testid="legal-review-notice" className="mt-5 rounded-card border border-hairline-strong bg-surface p-4 text-body text-bone">
        {t.legal.czechOnlyNotice}
      </p>
      <p className="mt-4 text-body text-muted">{t.legal.reviewBody.replace("{email}", OPERATOR_CONTACT.email)}</p>
      <Link
        href="/games"
        className="mt-10 inline-flex min-h-11 items-center text-small text-faint no-underline hover:text-accent-dim"
      >
        {t.legal.back}
      </Link>
    </main>
  );
}
