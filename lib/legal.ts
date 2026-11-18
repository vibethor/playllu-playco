/**
 * Which revision of the legal documents a player is being asked to accept,
 * and who the operator behind them is.
 *
 * THE DOCUMENTS ARE THE LAWYER'S, delivered 2026-10-15 as version 2.0 and
 * published 2026-10-19: `content/legal/original/`, rendered by
 * `lib/content/legalDocuments.ts`. They replace the 1.0 terms of 2026-08-01
 * and the DRAFT privacy placeholder.
 *
 * CZECH ONLY, AND THAT REPLACES THE 2026-08-01 RULING. That ruling said a
 * language without an authored document falls back to English behind a
 * notice. There is no English any more: contracts are concluded in Czech
 * (Terms 1.5), and the lawyer delivered Czech alone. So every locale shows the
 * Czech text, and every locale except Czech is told, in its own language,
 * that the Czech text binds. The documents are never machine-translated — an
 * unreviewed translation of a legally operative text is worse than the
 * original in a language the reader can identify.
 *
 * Each version string equals the "verze" printed in its document's header,
 * and a unit test holds them together: these strings are stamped onto
 * consent records, so the record of what someone agreed to and the words they
 * were shown cannot drift apart. Bump one when, and only when, its words
 * change.
 */
/*
 * PLAYCO, 3.0 (Jachym, 18 Nov 2026): the terms and the privacy policy are now Playco's own English texts
 * (`lib/content/termsDraft.ts`, `lib/content/privacyDraft.ts`), written on the logic of HrajFotbal's Czech 2.0 and not
 * yet reviewed by a lawyer. Each prints its version and a unit test holds the two together, as before. 3.1 (same day):
 * the operator is presented as Playco, without a personal name.
 */
export const TERMS_VERSION = "3.1" as const;

export const PRIVACY_VERSION = "3.1" as const;

/** The day the 3.0 terms and privacy policy took effect, as the documents print it. */
export const LEGAL_EFFECTIVE_DATE = "18 November 2026";

/**
 * The versions HrajFotbal's inherited Czech files print ("verze 2.0"). They stay in `content/legal/original/` for
 * reference and keep their own tests; nothing is accepted against them on Playco any more.
 */
export const ORIGINAL_DOCUMENT_VERSIONS = { terms: "2.0", privacy: "2.0", cookies: "2.0" } as const;

/*
 * NO PERSONAL NAME IN THE DOCUMENTS (Jachym, 18 Nov 2026: "remove my name ... and just keep it under Playco"). The
 * terms and the privacy policy present the business as Playco; who holds it in law is for the lawyer's review.
 */

/** The youngest a player may be to open an account (Playco terms 4.1). */
export const MINIMUM_ACCOUNT_AGE = 18;

export const COOKIES_VERSION = "2.0" as const;

/**
 * The cookie policy's version WHILE analytics runs (2026-10-26): the table
 * gained Google and Meta and article 2.2 changed, so the page reads "verze 2.1"
 * (a documented substitution in content/legal/substitutions.json — the two
 * must match). The consent banner only exists while analytics runs, so this is
 * the version every stored choice is made against.
 */
export const COOKIES_VERSION_WITH_ANALYTICS = "2.1" as const;

/**
 * The operator, from the lawyer's brief (item 1.1) and the owner's ruling of
 * 2026-10-19: the operator is Playllu, the holding company. General and
 * consumer matters go to `email`; personal-data matters to `privacyEmail`.
 * No phone number is published yet.
 *
 * Facts rather than copy, which is why they live here and not in
 * `lib/strings.ts`: an address is the same string in every language.
 */
export const OPERATOR_CONTACT = {
  email: "support@playllu.com",
  privacyEmail: "privacy@playllu.com",
} as const;

/**
 * The rules annex inside the terms — `/terms#pravidla`. Linked from signup,
 * from the booking emails and from the page itself.
 */
export const TERMS_RULES_ANCHOR = "pravidla";

/** Where the terms are published as a PDF (the lawyer's brief, item 1.2). */
export const TERMS_PDF_PATH = "/legal/obchodni-podminky.pdf";

/** PLAYCO: false until the lawyer-reviewed Thai terms replace the inherited Czech PDF (see `termsAttachments`). */
export const TERMS_PDF_READY = false;
