import { DATE_LOCALE, type DateLocale } from "@/lib/format";

/**
 * A POST'S DAY, WRITTEN OUT: "24 November 2026". A post carries calendar days, not moments, so the day is
 * formatted in UTC — the zone the `YYYY-MM-DD` was parsed in — and reads the same wherever the server runs.
 * The language tags are the product's own (`DATE_LOCALE`), so Thai keeps the Gregorian year here too.
 */
export function formatPostDay(day: string, locale: DateLocale = "en"): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${day}T00:00:00Z`));
}
