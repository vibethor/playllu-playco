import type { MetadataRoute } from "next";
import { loadPosts } from "@/lib/blog/posts";
import { postPath } from "@/lib/blog/schema";
import { publishedPosts } from "@/lib/blog/visibility";
import { gamePath } from "@/lib/games/link";
import { listUpcomingGames } from "@/lib/games/queries";
import { PASSES_ENABLED } from "@/lib/pass/enabled";
import { sitemapFor } from "@/lib/seo/site";
import { siteUrl } from "@/lib/site";

/** `/sitemap.xml` — see `lib/seo/site.ts`. Every upcoming game the games list shows is listed, and every published post. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, { games }] = await Promise.all([siteUrl(), listUpcomingGames(null)]);
  return sitemapFor(site, {
    passes: PASSES_ENABLED,
    // Finished posts only, on every deployment: a draft is never announced to a crawler.
    posts: publishedPosts(loadPosts()).map((post) => ({ path: postPath(post.slug), lastModified: post.dateModified })),
    games: games.map(({ game }) => ({
      id: game.id,
      startsAt: game.starts_at,
      path: gamePath(game),
      lastModified: game.created_at,
    })),
  });
}
