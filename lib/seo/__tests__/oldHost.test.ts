import { describe, expect, it } from "vitest";
import { KEPT_ON_OLD_HOST, OLD_HOST, oldHostRedirects } from "@/lib/seo/oldHost";

const SITE = "https://playco.live";

/** The pattern of the page rule's first segment, as a plain RegExp, to test what it lets through. */
function firstSegmentPattern(): RegExp {
  const pageRule = oldHostRedirects(SITE)[1];
  const pattern = pageRule?.source.match(/^\/:first\((.+)\)\/:rest\*$/)?.[1] ?? "";
  return new RegExp(`^/(${pattern})(?:/.*)?$`);
}

describe("the old Vercel address", () => {
  it("forwards its home page and its pages to the real site, permanently", () => {
    // Act
    const rules = oldHostRedirects(SITE);

    // Assert
    expect(rules).toHaveLength(2);
    expect(rules.every((rule) => rule.permanent && rule.has[0]?.value === OLD_HOST)).toBe(true);
    expect(rules[0]).toMatchObject({ source: "/", destination: `${SITE}/` });
    expect(rules[1]?.destination).toBe(`${SITE}/:first/:rest*`);
  });

  it.each(["/games", "/game/8", "/pass", "/apiary", "/author/jay"])("moves the page %s", (path) => {
    expect(firstSegmentPattern().test(path)).toBe(true);
  });

  it.each(["/api/stripe/webhook", "/api", "/auth/callback", "/_next/static/chunk.js"])(
    "keeps %s answering on the old host, because a webhook does not follow a redirect",
    (path) => {
      expect(firstSegmentPattern().test(path)).toBe(false);
    },
  );

  it("names every kept segment in the rule", () => {
    const pageRule = oldHostRedirects(SITE)[1];
    for (const segment of KEPT_ON_OLD_HOST) expect(pageRule?.source).toContain(segment);
  });

  it("adds no rule when the configured site is the old host itself, which would redirect in a circle", () => {
    expect(oldHostRedirects(`https://${OLD_HOST}`)).toEqual([]);
  });

  it("adds no rule when no site address is configured, or it is not a URL", () => {
    expect(oldHostRedirects(undefined)).toEqual([]);
    expect(oldHostRedirects("not a url")).toEqual([]);
  });

  it("drops a trailing slash or path from the configured address", () => {
    expect(oldHostRedirects(`${SITE}/`)[0]?.destination).toBe(`${SITE}/`);
  });
});
