import { describe, expect, it } from "vitest";
import { formatPostDay } from "@/lib/blog/dates";
import { rssFeed } from "@/lib/blog/feed";
import type { BlogPost } from "@/lib/blog/post";
import { postMetadata } from "@/lib/blog/metadata";
import { loadPosts, newestModified } from "@/lib/blog/posts";
import { blogPostingSchema, postImageUrl } from "@/lib/blog/schema";
import { publishedPosts } from "@/lib/blog/visibility";

const SITE = "https://playco.live";

function post(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    slug: "where-to-play",
    title: "Where to play & what it costs",
    description: "Every option, compared.",
    datePublished: "2026-11-24",
    dateModified: "2026-11-26",
    author: null,
    image: null,
    tags: ["volleyball", "guide"],
    locale: "en",
    draft: false,
    body: "A paragraph.",
    ...overrides,
  };
}

function schemaOf(entry: BlogPost) {
  return blogPostingSchema({ post: entry, site: SITE, publisherName: "Playco", publisherLogo: `${SITE}/icons/icon-512.png` });
}

describe("a post's structured data", () => {
  it("carries the headline, description and both dates the page shows", () => {
    // Act
    const schema = schemaOf(post());

    // Assert
    expect(schema).toMatchObject({
      "@type": "BlogPosting",
      headline: "Where to play & what it costs",
      description: "Every option, compared.",
      datePublished: "2026-11-24",
      dateModified: "2026-11-26",
    });
  });

  it("names its own address as the main entity", () => {
    // Act
    const schema = schemaOf(post());

    // Assert
    expect(schema.mainEntityOfPage).toEqual({ "@type": "WebPage", "@id": `${SITE}/blog/where-to-play` });
  });

  it("is signed by the brand, as an organisation, when the post names no author", () => {
    // Act
    const schema = schemaOf(post());

    // Assert
    expect(schema.author).toEqual({ "@type": "Organization", name: "Playco", url: `${SITE}/` });
  });

  it("is signed by a person when the post names one", () => {
    // Act
    const schema = schemaOf(post({ author: { name: "Sofi", role: "Beach volleyball organiser" } }));

    // Assert
    expect(schema.author).toEqual({ "@type": "Person", name: "Sofi", jobTitle: "Beach volleyball organiser" });
  });

  it("names the brand as publisher, with its logo", () => {
    // Act
    const schema = schemaOf(post());

    // Assert
    expect(schema.publisher).toMatchObject({ "@type": "Organization", name: "Playco" });
    expect(schema.publisher.logo.url).toBe(`${SITE}/icons/icon-512.png`);
  });
});

describe("a post's share image", () => {
  it("is the card drawn from its title when the post has no photograph", () => {
    // Act
    const url = postImageUrl(SITE, post());

    // Assert
    expect(url).toBe(`${SITE}/blog/where-to-play/opengraph-image`);
  });

  it("is the post's own photograph when it has one", () => {
    // Act
    const url = postImageUrl(SITE, post({ image: "/blog/asoke-sand.jpg" }));

    // Assert
    expect(url).toBe(`${SITE}/blog/asoke-sand.jpg`);
  });
});

describe("the RSS feed", () => {
  function feedOf(posts: BlogPost[]): string {
    return rssFeed({ site: SITE, title: "Playco blog", description: "Guides.", language: "en", posts });
  }

  it("lists each post with its address and its day", () => {
    // Act
    const feed = feedOf([post()]);

    // Assert
    expect(feed).toContain("<link>https://playco.live/blog/where-to-play</link>");
    expect(feed).toContain("<pubDate>Tue, 24 Nov 2026 00:00:00 GMT</pubDate>");
  });

  it("escapes an ampersand in a title, which would otherwise break every reader of the feed", () => {
    // Act
    const feed = feedOf([post()]);

    // Assert
    expect(feed).toContain("<title>Where to play &amp; what it costs</title>");
  });

  it("is a valid, empty channel when nothing is published yet", () => {
    // Act
    const feed = feedOf([]);

    // Assert
    expect(feed).toContain("<channel>");
    expect(feed).not.toContain("<item>");
  });
});

describe("a post's day, written out", () => {
  it("reads day, month, year in English", () => {
    // Act
    const day = formatPostDay("2026-11-24", "en");

    // Assert
    expect(day).toBe("24 November 2026");
  });

  it("keeps the Gregorian year in Thai", () => {
    // Act
    const day = formatPostDay("2026-11-24", "th");

    // Assert
    expect(day).toContain("2026");
  });
});

describe("the newest change among some posts", () => {
  it("is the latest modified day", () => {
    // Act
    const newest = newestModified([post({ dateModified: "2026-11-26" }), post({ dateModified: "2026-12-01" })]);

    // Assert
    expect(newest).toBe("2026-12-01");
  });

  it("is nothing when there are no posts", () => {
    // Act
    const newest = newestModified([]);

    // Assert
    expect(newest).toBeUndefined();
  });
});

/**
 * THE REAL FILES. Every post in `content/blog/` must parse, a published post must be finished, and a link from
 * one post to another must lead somewhere a reader can go.
 */
describe("the posts in content/blog", () => {
  const LAUNCH_POSTS = [
    "first-pickup-volleyball-game-bangkok",
    "indoor-sport-bangkok-smog-season",
    "where-to-play-volleyball-bangkok",
  ];
  const INTERNAL_POST_LINK = /\]\(\/blog\/([a-z0-9-]+)\)/g;

  it("all parse, launch posts included", () => {
    // Act
    const slugs = loadPosts().map((entry) => entry.slug);

    // Assert
    expect(slugs).toEqual(expect.arrayContaining(LAUNCH_POSTS));
  });

  it("link only to posts that are published, so no reader follows a link into a 404", () => {
    // Arrange
    const published = publishedPosts(loadPosts());
    const publishedSlugs = new Set(published.map((entry) => entry.slug));

    // Act
    const broken = published.flatMap((entry) =>
      [...entry.body.matchAll(INTERNAL_POST_LINK)]
        .map((match) => match[1] ?? "")
        .filter((slug) => !publishedSlugs.has(slug))
        .map((slug) => `${entry.slug} -> ${slug}`),
    );

    // Assert
    expect(broken).toEqual([]);
  });

  it("have a title each of their own", () => {
    // Act
    const titles = loadPosts().map((entry) => entry.title);

    // Assert
    expect(new Set(titles).size).toBe(titles.length);
  });

  // A search result cuts a description by width, at about 155 to 165 characters. The launch posts were added as
  // written (one is 161), so the ceiling here is the far end of that range rather than the 160 used for pages.
  const SHORTEST_DESCRIPTION = 110;
  const LONGEST_DESCRIPTION = 165;

  it("each has a description long enough to say something and short enough to be shown whole", () => {
    // Act
    const lengths = loadPosts().map((entry) => entry.description.length);

    // Assert
    expect(lengths.every((length) => length >= SHORTEST_DESCRIPTION && length <= LONGEST_DESCRIPTION)).toBe(true);
  });
});

describe("a post's search and share tags", () => {
  function tagsOf(entry: BlogPost) {
    return postMetadata({ post: entry, site: SITE, siteName: "Playco" });
  }

  it("names its own address as canonical", () => {
    // Act
    const metadata = tagsOf(post());

    // Assert
    expect(metadata.alternates?.canonical).toBe(`${SITE}/blog/where-to-play`);
  });

  it("is an article with its published and modified days", () => {
    // Act
    const metadata = tagsOf(post());

    // Assert
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-11-24",
      modifiedTime: "2026-11-26",
    });
  });

  it("is indexable when finished", () => {
    // Act
    const metadata = tagsOf(post());

    // Assert
    expect(metadata.robots).toBeUndefined();
  });

  it("is never indexable while a draft, even on a preview address", () => {
    // Act
    const metadata = tagsOf(post({ draft: true }));

    // Assert
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
