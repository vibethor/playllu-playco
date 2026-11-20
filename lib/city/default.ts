/**
 * THE ONE CITY, UNTIL CITIES ARE DATA.
 *
 * Phase F (docs/EXECUTION_PLAN.md) puts Bangkok online before cities exist in the database. Everything that depends on
 * where the games are — time zone, phone prefix, site name — reads it from here, and nowhere else, so that Phase 2
 * can replace this file with the city row in one move. This is the only file in app/, components/ and lib/ allowed
 * to name a place.
 */
export const DEFAULT_CITY = {
  /** URL-safe key, matches `games.city` / `venues.city` in the database. */
  slug: "bangkok",
  /** IANA time zone every user-visible datetime renders in. */
  timeZone: "Asia/Bangkok",
  /** ISO 3166-1 alpha-2 country whose phone prefix the phone field starts with. */
  phoneCountry: "TH",
  /** ISO 4217 code of the city's prices, as analytics and Meta expect it (upper case). */
  currency: "THB",
} as const;

/** The brand players see. */
export const SITE_NAME = "Playco";

/**
 * The sport a game is, until `games` has a `sport` column (an open decision). Every Playco game today is
 * volleyball; structured data read "Football", inherited from the fork, until 20 Nov 2026.
 */
export const DEFAULT_SPORT = "Volleyball";

/**
 * THE LAW THE GAMES ARE PLAYED UNDER (Jachym, 18 Nov 2026: Playco's own English terms and privacy policy). Legal
 * texts name the country, its data protection law, its authorities and its emergency number; they read them from here
 * so a second country is a second row, not an edit of the documents.
 */
export const LEGAL_JURISDICTION = {
  country: "Thailand",
  governingLaw: "the laws of Thailand",
  courts: "the courts of Thailand",
  dataProtectionLaw: "Thailand's Personal Data Protection Act B.E. 2562 (2019) (the PDPA)",
  dataProtectionAuthority: "the Office of the Personal Data Protection Committee (PDPC)",
  consumerAuthority: "the Office of the Consumer Protection Board (OCPB, hotline 1166)",
  /** Medical emergencies (ambulance). */
  emergencyNumber: "1669",
  /** The age of majority: below it a person needs a parent's or guardian's consent to contract. */
  ageOfMajority: 20,
  /** Where the database runs; other providers are named in the privacy policy. */
  databaseRegion: "Singapore",
} as const;
