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
export function homeStructuredData(site: string, options: { sameAs?: readonly string[]; description?: string } = {}) {
  const url = `${site}/`;
  const { sameAs = [], description } = options;
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
 * The public pages a search engine should know about. `/contact` and `/terms`
 * are noindex (the owner kept them out of the result's sub-links), so they are
 * not listed.
 *
 * GAME PAGES ARE LISTED (Playco, 17 Nov 2026, Jachym: "have Google index our
 * public pages"). ~~Game pages are not listed: they live a week~~ — a week is
 * exactly the window a search for "volleyball Bangkok this week" has, so every
 * upcoming game the games list shows is in the sitemap too. The route passes
 * them in; this stays pure.
 */
const PUBLIC_PATHS = ["/", "/games", "/signup", "/privacy", "/cookies"] as const;

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
  games?: readonly { id: string; startsAt: string; /** The game's canonical path (its short link), when known. */ path?: string }[];
}

export function sitemapFor(site: string, options: SitemapOptions = {}): MetadataRoute.Sitemap {
  const { passes = false, games = [] } = options;
  const pages: MetadataRoute.Sitemap = PUBLIC_PATHS.map((path) => {
    if (path === "/") return { url: `${site}/`, ...SITEMAP_RANK.home };
    if (path === "/games") return { url: `${site}${path}`, ...SITEMAP_RANK.games };
    return { url: `${site}${path}`, ...SITEMAP_RANK.other };
  });
  const pass: MetadataRoute.Sitemap = passes ? [{ url: `${site}/pass`, ...SITEMAP_RANK.pass }] : [];
  const gamePages: MetadataRoute.Sitemap = games.map((game) => ({
    // The same address the game page names as canonical, so the sitemap and the page agree.
    url: game.path ? canonicalFor(site, game.path) : `${site}/game/${encodeURIComponent(game.id)}`,
    ...SITEMAP_RANK.game,
  }));
  return [...pages, ...pass, ...gamePages];
}
