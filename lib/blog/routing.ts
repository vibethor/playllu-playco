/**
 * WHAT A REQUEST UNDER `/blog` IS, DECIDED BEFORE ANYTHING IS RENDERED (blog section, 24 Nov 2026).
 *
 * The proxy asks this for every request, because of the root loading boundary (`app/loading.tsx`), which starts
 * every response before the page has run. `notFound()` thrown inside a page therefore arrives after the response
 * has started and the status stays 200 — measured on this build, for an immediate `notFound()` too, and
 * `dynamicParams = false` did not change it. A POST THIS DEPLOYMENT DOES NOT SHOW MUST BE A REAL 404 — a draft
 * in production, a mistyped address — not a "Nothing here" page that answers 200. So the proxy sends such an
 * address to a path no route matches, and the router answers 404 with the site's own not-found page.
 *
 * PURE: a path and the readable slugs in, the kind of request out.
 */

/** A path no route matches; the router answers it with the not-found page and status 404. */
export const BLOG_NOT_FOUND_PATH = "/_blog/post-not-found";

/** `/blog/<one segment>`, with or without a trailing slash. */
const POST_PATH = /^\/blog\/([^/]+)\/?$/;

/** Addresses directly under `/blog` that are not posts. */
const NOT_POSTS: readonly string[] = ["rss.xml"];

export type BlogRoute = { kind: "other" } | { kind: "post"; slug: string } | { kind: "missing" };

function decoded(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    // Not valid percent-encoding: no post has such an address, and "missing" is the whole answer.
    return null;
  }
}

export function blogRoute(pathname: string, readableSlugs: readonly string[]): BlogRoute {
  const segment = POST_PATH.exec(pathname)?.[1];
  if (!segment || NOT_POSTS.includes(segment)) return { kind: "other" };

  const slug = decoded(segment);
  if (slug === null || !readableSlugs.includes(slug)) return { kind: "missing" };
  return { kind: "post", slug };
}
