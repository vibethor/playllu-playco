/**
 * THE SECURITY HEADERS EVERY RESPONSE CARRIES (technical SEO pass, Jachym, 20 Nov 2026). `next.config.ts` applies
 * them to every path.
 *
 * Vercel already redirects http to https; HSTS makes the browser skip the insecure request altogether. Two years,
 * subdomains included, `preload`-eligible: every playco.live host is served over HTTPS (www redirects to the apex).
 *
 * NO Content-Security-Policy YET, on purpose. The site loads Google Tag Manager (which injects GA4 and the Meta
 * Pixel), Stripe's embedded checkout and Supabase storage; a policy written without testing each of those in a
 * browser would break payments or tracking. It needs its own change, started in report-only mode.
 *
 * `X-Frame-Options: SAMEORIGIN` stops other sites framing Playco (clickjacking). Playco frames Stripe, not the
 * other way round, so checkout is unaffected.
 */
const TWO_YEARS_SECONDS = 2 * 365 * 24 * 60 * 60;

export const SECURITY_HEADERS: readonly { key: string; value: string }[] = [
  { key: "Strict-Transport-Security", value: `max-age=${TWO_YEARS_SECONDS}; includeSubDomains; preload` },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];
