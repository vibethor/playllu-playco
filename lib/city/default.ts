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
} as const;

/** The brand players see. */
export const SITE_NAME = "Playco";
