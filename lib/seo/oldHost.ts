/**
 * THE FIRST VERCEL ADDRESS FORWARDS TO THE REAL ONE (SEO audit, 24 Nov 2026).
 *
 * `playco-ten.vercel.app` still answered every page with a 200 a week after `playco.live` went live: a second,
 * complete copy of the site, held apart from the first by a canonical tag alone. A canonical is a hint; a permanent
 * redirect is an answer.
 *
 * IN CODE, NOT IN THE VERCEL DASHBOARD, because of what must NOT move. A domain redirect set in Vercel forwards
 * every path, `/api` included, and the Stripe test webhook `playco-vercel` still posts to
 * `playco-ten.vercel.app/api/stripe/webhook` (setup log, 17 Nov). A webhook sender does not follow a redirect, it
 * records a failure. So machine-called paths keep answering on the old host and only pages move.
 *
 * Keyed on the literal old host, like the `hrajsport.cz` rule beside it in `next.config.ts`: preview deployments
 * have other hostnames and are untouched.
 */
export const OLD_HOST = "playco-ten.vercel.app";

/**
 * First path segments that stay on the old host: `api` (webhooks, cron), `auth` (sign-in callbacks an old email may
 * still point at) and `_next` (the assets of a page already open in someone's tab).
 */
export const KEPT_ON_OLD_HOST = ["api", "auth", "_next"] as const;

interface HostRedirect {
  source: string;
  has: { type: "host"; value: string }[];
  destination: string;
  permanent: true;
}

function originOf(siteUrl: string | undefined): string | null {
  if (!siteUrl) return null;
  try {
    return new URL(siteUrl).origin;
  } catch {
    // A malformed NEXT_PUBLIC_SITE_URL must not break the build; no redirect is the safe answer.
    return null;
  }
}

/**
 * The redirect rules, or none when the configured site IS the old host (a redirect to itself) or is not set.
 * `siteUrl` is a parameter so the rules can be tested without touching the environment.
 */
export function oldHostRedirects(siteUrl: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): HostRedirect[] {
  const origin = originOf(siteUrl);
  if (!origin || new URL(origin).host === OLD_HOST) return [];

  const has: HostRedirect["has"] = [{ type: "host", value: OLD_HOST }];
  // A first segment that is not one of the kept ones. `(?:/|$)` so `/apiary` and `/author` still move.
  const firstSegment = `(?!(?:${KEPT_ON_OLD_HOST.join("|")})(?:/|$))[^/]+`;
  return [
    { source: "/", has, destination: `${origin}/`, permanent: true },
    { source: `/:first(${firstSegment})/:rest*`, has, destination: `${origin}/:first/:rest*`, permanent: true },
  ];
}
