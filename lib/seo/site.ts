import type { MetadataRoute } from "next";

/**
 * How the site presents itself to search engines (2026-11-06, the owner: "the
 * website doesn't show the logo on the web ... and the header beneath the
 * clickable link — could we have a different text there that reflects the
 * homepage?").
 *
 * PURE, taking the site's origin, so the three route files (`app/robots.ts`,
 * `app/sitemap.ts`, the home page's JSON-LD) only resolve the origin and hand
 * it over.
 */

const SITE_NAME = "Playco";

/**
 * The home page's JSON-LD: a WebSite (the site name a result shows) and an
 * Organization (the logo). The logo is the 512px icon the PWA manifest already
 * serves — square, and well over the 112px floor search engines ask for.
 */
export interface HomeStructuredDataOptions {
  sameAs?: readonly string[];
  description?: string;
  /** The support address the site already shows on `/contact`. */
  contactEmail?: string;
  /** Languages support answers in (BCP 47), e.g. `["en", "th"]`. */
  contactLanguages?: readonly string[];
  /** The city the games are in, by name. */
  areaServed?: string;
  /** The group the brand belongs to, by name, as the terms state it. */
  parentOrganization?: string;
}

export function homeStructuredData(site: string, options: HomeStructuredDataOptions = {}) {
  const url = `${site}/`;
  const { sameAs = [], description, contactEmail, contactLanguages = [], areaServed, parentOrganization } = options;
  const website: Record<string, unknown> = { "@type": "WebSite", name: SITE_NAME, url };
  const organization: Record<string, unknown> = {
    "@type": "Organization",
    name: SITE_NAME,
    url,
    logo: `${site}/icons/icon-512.png`,
  };
  if (description) {
    website.description = description;
    organization.description = description;
  }
  // The social profiles (20 Nov 2026): `sameAs` is how a search engine ties @playco.live to this site.
  if (sameAs.length > 0) organization.sameAs = [...sameAs];
  /*
   * WHO IS BEHIND THE NAME (SEO audit, 24 Nov 2026). "Playco" is also a games company and a playground maker; a
   * reachable contact, the city served and the group it belongs to are what tell this one apart. Each is optional
   * and absent rather than empty when the page has nothing to say.
   */
  if (contactEmail) {
    organization.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: contactEmail,
      ...(contactLanguages.length > 0 ? { availableLanguage: [...contactLanguages] } : {}),
    };
  }
  if (areaServed) organization.areaServed = { "@type": "City", name: areaServed };
  if (parentOrganization) organization.parentOrganization = { "@type": "Organization", name: parentOrganization };
  return { "@context": "https://schema.org", "@graph": [website, organization] };
}

/**
 * A PAGE'S CANONICAL ADDRESS (technical SEO pass, 20 Nov 2026): its own path on the configured origin, with no
 * query string. Every marketing link carries `utm_` tags and the games list takes `?day=`; without a canonical each
 * of those is a separate page to a search engine, competing with the real one.
 */
export function canonicalFor(site: string, path: string): string {
  const [pathname = "/"] = path.split(/[?#]/);
  if (pathname === "/" || pathname === "") return `${site}/`;
  return `${site}${pathname.replace(/\/+$/, "")}`;
}

/** BreadcrumbList JSON-LD: the trail a search result shows in place of the raw address. */
export function breadcrumbList(site: string, trail: readonly { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      item: canonicalFor(site, step.path),
    })),
  };
}

/** Serialises JSON-LD for a `<script>` body. Escaping `<` stops admin-typed text closing the tag. */
export function jsonLdScript(schema: unknown): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}

/**
 * robots.txt. Before this, `/robots.txt` answered with the site's HTML page
 * and a 200 — the soft 404 CLAUDE.md describes — which a crawler reads as an
 * unparseable file.
 */
export function robotsFor(site: string): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/account", "/my-games", "/payment"],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}

/**
 * The public pages a search engine should know about. `/terms` is noindex (the
 * owner kept it out of the result's sub-links), so it is not listed.
 *
 * 24 Nov 2026 (SEO audit, Jachym): `/contact` IS LISTED and indexable again — who runs a site that takes payment
 * is a trust question, and the answer was hidden from search. `/signup` IS NOT: a form with no reading on it, now
 * noindex like `/login`.
 *
 * GAME PAGES ARE LISTED (Playco, 17 Nov 2026, Jachym: "have Google index our
 * public pages"). ~~Game pages are not listed: they live a week~~ — a week is
 * exactly the window a search for "volleyball Bangkok this week" has, so every
 * upcoming game the games list shows is in the sitemap too. The route passes
 * them in; this stays pure.
 */
const PUBLIC_PATHS = ["/", "/games", "/contact", "/privacy", "/cookies"] as const;

/**
 * WHEN EACH FIXED PAGE LAST CHANGED IN A WAY A READER WOULD NOTICE. A real date, edited by hand with the page:
 * a `lastmod` of "now" on every request teaches a crawler to ignore the field. `/` and `/games` are not here
 * because they change with the games; they take the newest game's time, passed in by the route.
 */
export const PAGE_LAST_MODIFIED: Readonly<Record<string, string>> = {
  "/contact": "2026-11-24",
  "/privacy": "2026-11-18",
  "/cookies": "2026-11-17",
  "/pass": "2026-11-19",
};

/** Where each kind of page sits in the sitemap: how often it changes, how much it matters. */
const SITEMAP_RANK = {
  home: { changeFrequency: "daily", priority: 1 },
  games: { changeFrequency: "daily", priority: 0.9 },
  game: { changeFrequency: "daily", priority: 0.7 },
  pass: { changeFrequency: "weekly", priority: 0.6 },
  other: { changeFrequency: "monthly", priority: 0.5 },
} as const satisfies Record<string, { changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }>;

export interface SitemapOptions {
  /** Whether game passes are on sale (`PASSES_ENABLED`): `/pass` is then a public page. */
  passes?: boolean;
  /** The upcoming games the games list shows. */
  games?: readonly {
    id: string;
    startsAt: string;
    /** The game's canonical path (its short link), when known. */
    path?: string;
    /** When the game row was last written (`games.created_at` until the row carries an update time). */
    lastModified?: string;
  }[];
}

/** The newest of the given ISO times, or nothing when none is given. */
function newest(times: readonly (string | undefined)[]): string | undefined {
  const known = times.filter((time): time is string => Boolean(time));
  if (known.length === 0) return undefined;
  return known.reduce((latest, time) => (Date.parse(time) > Date.parse(latest) ? time : latest));
}

function withLastModified<T extends object>(entry: T, lastModified: string | undefined): T & { lastModified?: string } {
  return lastModified ? { ...entry, lastModified } : entry;
}

export function sitemapFor(site: string, options: SitemapOptions = {}): MetadataRoute.Sitemap {
  const { passes = false, games = [] } = options;
  // The home page and the games list show the games, so they changed when the newest game did.
  const gamesChanged = newest(games.map((game) => game.lastModified));
  const pages: MetadataRoute.Sitemap = PUBLIC_PATHS.map((path) => {
    if (path === "/") return withLastModified({ url: `${site}/`, ...SITEMAP_RANK.home }, gamesChanged);
    if (path === "/games") return withLastModified({ url: `${site}${path}`, ...SITEMAP_RANK.games }, gamesChanged);
    return withLastModified({ url: `${site}${path}`, ...SITEMAP_RANK.other }, PAGE_LAST_MODIFIED[path]);
  });
  const pass: MetadataRoute.Sitemap = passes
    ? [withLastModified({ url: `${site}/pass`, ...SITEMAP_RANK.pass }, PAGE_LAST_MODIFIED["/pass"])]
    : [];
  const gamePages: MetadataRoute.Sitemap = games.map((game) =>
    withLastModified(
      {
        // The same address the game page names as canonical, so the sitemap and the page agree.
        url: game.path ? canonicalFor(site, game.path) : `${site}/game/${encodeURIComponent(game.id)}`,
        ...SITEMAP_RANK.game,
      },
      game.lastModified,
    ),
  );
  return [...pages, ...pass, ...gamePages];
}
