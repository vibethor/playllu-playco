import { parsePost, type BlogPost } from "@/lib/blog/post";
import { BLOG_SOURCES } from "@/lib/blog/posts.generated";
import { draftsVisible, visiblePosts } from "@/lib/blog/visibility";

/**
 * THE POSTS (blog section, 24 Nov 2026). Written in `content/blog/<slug>.md`, embedded by
 * `scripts/blog/build-blog.mjs` into `posts.generated.ts`, parsed here once per server process — the text ships
 * with the deployment and cannot change under it. Nothing is read from disk at request time; the build script
 * says why.
 *
 * NEWEST FIRST, and by slug within a day so the order is the same on every machine.
 */
let parsed: readonly BlogPost[] | null = null;

export function parseSources(sources: Readonly<Record<string, string>>): BlogPost[] {
  return Object.entries(sources)
    .map(([fileSlug, source]) => parsePost(source, fileSlug))
    .sort((a, b) => b.datePublished.localeCompare(a.datePublished) || a.slug.localeCompare(b.slug));
}

export function loadPosts(): readonly BlogPost[] {
  parsed ??= parseSources(BLOG_SOURCES);
  return parsed;
}

/** The posts this deployment shows a reader: drafts included on a preview, never in production. */
export function readablePosts(): BlogPost[] {
  return visiblePosts(loadPosts(), draftsVisible());
}

export function findReadablePost(slug: string): BlogPost | null {
  return readablePosts().find((post) => post.slug === slug) ?? null;
}

/** The newest `dateModified` among the posts, or nothing when there are none. */
export function newestModified(posts: readonly BlogPost[]): string | undefined {
  return posts.reduce<string | undefined>(
    (newest, post) => (newest && newest >= post.dateModified ? newest : post.dateModified),
    undefined,
  );
}
