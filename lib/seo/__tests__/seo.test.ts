import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/i18n/locales";
import { resolveStrings } from "@/lib/i18n/resolve";
import { SECURITY_HEADERS } from "@/lib/seo/securityHeaders";
import { breadcrumbList, canonicalFor, homeStructuredData, robotsFor, sitemapFor } from "@/lib/seo/site";

/**
 * How the site reads in a search result (2026-11-06, the owner: "the website
 * doesn't show the logo on the web ... and the header beneath the clickable
 * link — could we have a different text there that reflects the homepage?").
 */
const SITE = "https://www.hrajfotbal.com";

describe("the home page's structured data", () => {
  it("names the site and its logo, so a result can carry both", () => {
    // Act
    const graph = homeStructuredData(SITE)["@graph"];

    // Assert
    expect(graph).toContainEqual(
      expect.objectContaining({ "@type": "WebSite", name: "Playco", url: `${SITE}/` }),
    );
    expect(graph).toContainEqual(
      expect.objectContaining({
        "@type": "Organization",
        name: "Playco",
        url: `${SITE}/`,
        logo: `${SITE}/icons/icon-512.png`,
      }),
    );
  });
});

describe("robots.txt", () => {
  it("lets crawlers in, keeps them out of admin and the API, and points at the sitemap", () => {
    const robots = robotsFor(SITE);

    expect(robots.rules).toEqual(
      expect.objectContaining({ userAgent: "*", allow: "/", disallow: expect.arrayContaining(["/admin", "/api"]) }),
    );
    expect(robots.sitemap).toBe(`${SITE}/sitemap.xml`);
  });
});

describe("the sitemap", () => {
  it("lists the public pages and none of the private ones", () => {
    const urls = sitemapFor(SITE).map((entry) => entry.url);

    expect(urls).toEqual(expect.arrayContaining([`${SITE}/`, `${SITE}/games`]));
    expect(urls.some((url) => /\/(admin|account|my-games|login|api|payment)/.test(url))).toBe(false);
  });

  it("leaves out Kontakt and Obchodní podmínky, which are noindex — kept out of the result's sub-links", () => {
    const urls = sitemapFor(SITE).map((entry) => entry.url);

    expect(urls).not.toContain(`${SITE}/contact`);
    expect(urls).not.toContain(`${SITE}/terms`);
  });

  it("lists the game pass page while passes are on sale", () => {
    // Act
    const urls = sitemapFor(SITE, { passes: true }).map((entry) => entry.url);

    // Assert
    expect(urls).toContain(`${SITE}/pass`);
  });

  it("leaves the game pass page out while passes are switched off", () => {
    // Act
    const urls = sitemapFor(SITE, { passes: false }).map((entry) => entry.url);

    // Assert
    expect(urls).not.toContain(`${SITE}/pass`);
  });

  it("lists every upcoming game's page, so a search engine finds a game the week it is played", () => {
    // Arrange
    const games = [
      { id: "7d3c1f2a-0000-4000-8000-000000000001", startsAt: "2026-11-19T12:00:00Z" },
      { id: "7d3c1f2a-0000-4000-8000-000000000002", startsAt: "2026-11-22T10:00:00Z" },
    ];

    // Act
    const entries = sitemapFor(SITE, { games });

    // Assert
    expect(entries.map((entry) => entry.url)).toEqual(
      expect.arrayContaining(games.map((game) => `${SITE}/game/${game.id}`)),
    );
  });

  it("marks a game page as changing daily, below the games list", () => {
    // Arrange
    const game = { id: "7d3c1f2a-0000-4000-8000-000000000003", startsAt: "2026-11-19T12:00:00Z" };

    // Act
    const entry = sitemapFor(SITE, { games: [game] }).find((e) => e.url === `${SITE}/game/${game.id}`);
    const gamesList = sitemapFor(SITE).find((e) => e.url === `${SITE}/games`);

    // Assert
    expect(entry?.changeFrequency).toBe("daily");
    expect(entry?.priority).toBeLessThan(gamesList?.priority ?? 0);
  });
});

/**
 * The result's sub-links (2026-11-06, the owner): "Herní permanentka" reads
 * "Game Pass", and each of the three carries its own line.
 */
describe("the sub-links' titles and lines", () => {
  it("are the owner's words in Czech", () => {
    // Act
    const { meta } = resolveStrings("cs");

    // Assert
    expect(meta.passTitle).toBe("Game Pass");
    expect(meta.passDescription).toBe("Objev Game Pass a získej výhodnější nabídku");
    expect(meta.gamesDescription).toBe("Najdi si zápas a přijď si zahrát");
    expect(meta.loginDescription).toBe("Přihlas se");
  });

  it("explore, in English", () => {
    // Rewritten 20 Nov 2026 (technical SEO pass): the caption said neither the sport nor the city.
    expect(resolveStrings("en").meta.passDescription).toMatch(/Game Pass.*volleyball.*Bangkok/);
  });
});

describe("the description under the result's link", () => {
  it.each(LOCALES)("fits a result in %s — long enough to say something, short enough not to be cut", (locale) => {
    const { description } = resolveStrings(locale).meta;

    expect(description.length).toBeGreaterThanOrEqual(110);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it("says where and when — Prague, anytime — in Czech, the language search reads", () => {
    const { description } = resolveStrings("cs").meta;

    expect(description).toMatch(/Praze/);
    expect(description).toMatch(/kdykoli/i);
  });
});

describe("favicon.ico", () => {
  it("exists, with 16, 32 and 48 pixel images — 48 is the size search results ask for", () => {
    // Arrange
    const ico = readFileSync("app/favicon.ico");

    // Act — ICONDIR, then one 16-byte ICONDIRENTRY per image.
    const count = ico.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, i) => ico[6 + i * 16] || 256);
    const firstImage = ico.readUInt32LE(6 + 12);

    // Assert
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(sizes).toEqual([16, 32, 48]);
    expect(ico.subarray(firstImage, firstImage + 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  });
});

/**
 * The technical SEO pass (Jachym, 20 Nov 2026): one address per page, breadcrumbs, the short game link in the
 * sitemap, and the social profile on the organisation.
 */
describe("a page's canonical address", () => {
  it("is the page's own path on the site, without a query string or a trailing slash", () => {
    // Act
    const canonical = canonicalFor(SITE, "/games");

    // Assert
    expect(canonical).toBe(`${SITE}/games`);
  });

  it("is the bare origin with a slash for the home page", () => {
    // Act
    const canonical = canonicalFor(SITE, "/");

    // Assert
    expect(canonical).toBe(`${SITE}/`);
  });

  it("drops a tracking query, so a tagged link and the plain page are one result", () => {
    // Act
    const canonical = canonicalFor(SITE, "/games?utm_source=reclub&day=2026-11-21");

    // Assert
    expect(canonical).toBe(`${SITE}/games`);
  });
});

describe("breadcrumbs for search results", () => {
  it("number the trail from 1 and give each step its absolute address", () => {
    // Arrange
    const trail = [
      { name: "Playco", path: "/" },
      { name: "Games", path: "/games" },
      { name: "Asoke", path: "/game/4" },
    ];

    // Act
    const schema = breadcrumbList(SITE, trail);

    // Assert
    expect(schema).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Playco", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Games", item: `${SITE}/games` },
        { "@type": "ListItem", position: 3, name: "Asoke", item: `${SITE}/game/4` },
      ],
    });
  });
});

describe("the sitemap's game addresses", () => {
  it("uses a game's short link when it has one, the address its page names as canonical", () => {
    // Arrange
    const game = { id: "7d3c1f2a-0000-4000-8000-000000000004", path: "/game/4", startsAt: "2026-11-21T11:00:00Z" };

    // Act
    const urls = sitemapFor(SITE, { games: [game] }).map((entry) => entry.url);

    // Assert
    expect(urls).toContain(`${SITE}/game/4`);
    expect(urls).not.toContain(`${SITE}/game/${game.id}`);
  });
});

describe("the organisation in the home page's structured data", () => {
  it("links its social profiles, so a search engine ties them to the site", () => {
    // Arrange
    const profiles = ["https://www.instagram.com/playco.live/"];

    // Act
    const organization = homeStructuredData(SITE, { sameAs: profiles })["@graph"].find(
      (node) => node["@type"] === "Organization",
    );

    // Assert
    expect(organization).toEqual(expect.objectContaining({ sameAs: profiles }));
  });
});

describe("the security headers every response carries", () => {
  it("force HTTPS for two years, subdomains included", () => {
    // Act
    const hsts = SECURITY_HEADERS.find((header) => header.key === "Strict-Transport-Security");

    // Assert
    expect(hsts?.value).toBe("max-age=63072000; includeSubDomains; preload");
  });

  it("stop MIME sniffing, framing by other sites and referrer leaks", () => {
    // Act
    const byKey = Object.fromEntries(SECURITY_HEADERS.map((header) => [header.key, header.value]));

    // Assert
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(byKey["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });
});

describe("the descriptions of the pages a search lands on", () => {
  const SEARCHED = ["gamesDescription", "passDescription", "signupDescription"] as const;

  it.each(SEARCHED)("%s fits a result in English: 110 to 160 characters", (key) => {
    // Act
    const description = resolveStrings("en").meta[key];

    // Assert
    expect(description.length).toBeGreaterThanOrEqual(110);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it("gives the games list a title that names the sport and the city", () => {
    // Act
    const { gamesTitle } = resolveStrings("en").meta;

    // Assert
    expect(gamesTitle).toMatch(/volleyball/i);
    expect(gamesTitle).toMatch(/Bangkok/);
  });
});
