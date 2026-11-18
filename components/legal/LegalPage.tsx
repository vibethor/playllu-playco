import Link from "next/link";
import { CookiePolicyDraft } from "@/components/legal/CookiePolicyDraft";
import { LegalDraft } from "@/components/legal/LegalDraft";
import { gtmEnabled } from "@/lib/analytics/gtm";
import { cookiePolicyDraft } from "@/lib/content/cookiePolicyDraft";
import type { LegalDocumentName } from "@/lib/content/legalDocuments";
import { privacyDraft } from "@/lib/content/privacyDraft";
import { termsDraft } from "@/lib/content/termsDraft";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { getLocale, getStrings } from "@/lib/i18n/server";
import { refundCutoffHours } from "@/lib/policy/refundCutoff";

/**
 * The shell shared by `/terms`, `/privacy` and `/cookies`.
 *
 * The furniture is translated and the document is not: a reader of another
 * language is told, in their language and above the text, that the document is
 * in English. English readers get no notice.
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
   * PLAYCO, 18 NOV 2026: THE TERMS AND THE PRIVACY POLICY ARE PLAYCO'S OWN ENGLISH TEXTS (Jachym: "write the terms and
   * conditions and the privacy pages in English and customize it to Playco ... I will have it reviewed by a lawyer
   * later"). HrajFotbal's Czech documents stay in `content/legal/original/` and are no longer shown. There is no PDF
   * of the English terms yet, so `pdfHref` is unused; the annex anchor is built into the terms themselves.
   */
  void pdfHref;
  void annexAnchor;
  const title = { terms: t.legal.termsTitle, privacy: t.legal.privacyTitle, cookies: t.legal.cookiesTitle }[name];
  /*
   * THE COOKIE POLICY IS AN ENGLISH DRAFT (Jachym, 17 Nov 2026), shown so the page explains the banner while the
   * lawyer reviews it.
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
  const draft =
    name === "terms"
      ? termsDraft({ refundCutoffHours: await refundCutoffHours() })
      : privacyDraft({ analytics: gtmEnabled() });
  /* The documents exist in English only; a reader of another language is told so, in their language. */
  const englishOnly = (await getLocale()) !== DEFAULT_LOCALE;
  return (
    <main className="relative z-10 mx-auto w-full max-w-content px-gutter pb-16 pt-24">
      <h1 className="m-0 font-display text-page-title font-bold text-bone">{title}</h1>
      {englishOnly ? (
        <p role="note" data-testid="legal-language-notice" className="mt-5 rounded-card border border-hairline-strong bg-surface p-4 text-body text-bone">
          {t.legal.englishOnlyNotice}
        </p>
      ) : null}
      <LegalDraft draft={draft} />
      <Link
        href="/games"
        className="mt-10 inline-flex min-h-11 items-center text-small text-faint no-underline hover:text-accent-dim"
      >
        {t.legal.back}
      </Link>
    </main>
  );
}
