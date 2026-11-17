import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/i18n/locales";
import { resolveStrings } from "@/lib/i18n/resolve";
import { homeStructuredData, robotsFor, sitemapFor } from "@/lib/seo/site";

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
    expect(resolveStrings("en").meta.passDescription).toBe("Explore Game Pass and get a better deal");
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
