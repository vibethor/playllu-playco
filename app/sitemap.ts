import type { MetadataRoute } from "next";
import { gamePath } from "@/lib/games/link";
import { listUpcomingGames } from "@/lib/games/queries";
import { PASSES_ENABLED } from "@/lib/pass/enabled";
import { sitemapFor } from "@/lib/seo/site";
import { siteUrl } from "@/lib/site";

/** `/sitemap.xml` — see `lib/seo/site.ts`. Every upcoming game the games list shows is listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, { games }] = await Promise.all([siteUrl(), listUpcomingGames(null)]);
  return sitemapFor(site, {
    passes: PASSES_ENABLED,
    games: games.map(({ game }) => ({
      id: game.id,
      startsAt: game.starts_at,
      path: gamePath(game),
      lastModified: game.created_at,
    })),
  });
}
