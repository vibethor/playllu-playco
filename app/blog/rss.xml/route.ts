import { rssFeed } from "@/lib/blog/feed";
import { loadPosts } from "@/lib/blog/posts";
import { publishedPosts } from "@/lib/blog/visibility";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { siteUrl } from "@/lib/site";
import { strings } from "@/lib/strings";

/** A feed reader asks often and a post changes rarely: an hour at the edge, revalidated in the background. */
const FEED_CACHE_SECONDS = 60 * 60;

/**
 * `/blog/rss.xml` — the published posts, newest first. Finished posts only, on every deployment: a feed is
 * something other programs subscribe to, and a draft that reached one cannot be taken back.
 */
export async function GET(): Promise<Response> {
  const feed = rssFeed({
    site: await siteUrl(),
    title: strings.blog.feedTitle,
    description: strings.blog.indexIntro,
    language: DEFAULT_LOCALE,
    posts: publishedPosts(loadPosts()),
  });
  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": `public, max-age=0, s-maxage=${FEED_CACHE_SECONDS}, stale-while-revalidate=${FEED_CACHE_SECONDS}`,
    },
  });
}
