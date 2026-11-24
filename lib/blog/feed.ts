import type { BlogPost } from "@/lib/blog/post";
import { postPath } from "@/lib/blog/schema";
import { canonicalFor } from "@/lib/seo/site";

/**
 * THE BLOG'S RSS FEED (blog section, 24 Nov 2026), written by hand: RSS 2.0 is a dozen elements and a feed
 * library would be the third dependency for them. Every value is escaped, because a title is free text and an
 * ampersand in one would otherwise make the whole feed unreadable to a parser.
 */
const XML_ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => XML_ENTITIES[character] ?? character);
}

/** RSS dates are RFC 822; a post's day is taken at midnight UTC. */
function rfc822(day: string): string {
  return new Date(`${day}T00:00:00Z`).toUTCString();
}

export function rssFeed(input: {
  site: string;
  title: string;
  description: string;
  language: string;
  posts: readonly BlogPost[];
}): string {
  const { site, title, description, language, posts } = input;
  const feedUrl = `${site}/blog/rss.xml`;
  const items = posts.map((post) => {
    const url = canonicalFor(site, postPath(post.slug));
    return [
      "    <item>",
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `      <description>${escapeXml(post.description)}</description>`,
      `      <pubDate>${rfc822(post.datePublished)}</pubDate>`,
      ...post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
      "    </item>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(title)}</title>`,
    `    <link>${escapeXml(`${site}/blog`)}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    `    <language>${escapeXml(language)}</language>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
