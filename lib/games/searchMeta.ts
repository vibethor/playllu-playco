import type { Database } from "@/lib/types/database";
import type { Strings } from "@/lib/strings";
import { formatGameDate, formatGameDateShort, formatThb, formatTime, type DateLocale } from "@/lib/format";
import { resolveDurationMinutes } from "@/lib/games/duration";
import { courtFormat } from "@/lib/games/teams";
import { fillTemplate } from "@/lib/i18n/template";

type GameRow = Database["public"]["Tables"]["games"]["Row"];

export type SearchMetaGame = Pick<
  GameRow,
  "venue" | "starts_at" | "duration_minutes" | "price_thb" | "format" | "surface"
>;

/**
 * WHAT A GAME PAGE SAYS IN A SEARCH RESULT (SEO audit, 24 Nov 2026).
 *
 * The title was `Swish Elite 50 — Sunday 29 November 17:00` and the description `17 spots left · 300 THB`: neither
 * the sport nor the city, and a spot count that is wrong within the hour of being indexed. Those two lines are
 * right for a WhatsApp preview, where the reader already knows what the link is, and they stay on `og:` and
 * `twitter:` for that reason. A search result is read by someone who knows neither, so it names the sport, the
 * surface, the venue, the city and the time, and says nothing that changes with each booking.
 *
 * PURE: the game row, the language and the string table in, two strings out.
 */
export function gameSearchMeta(
  game: SearchMetaGame,
  locale: DateLocale,
  t: Strings,
): { title: string; description: string } {
  const surface = game.surface ? t.games.surface[game.surface] : "";
  const shared = { venue: game.venue, surface };

  const title = fillTemplate(surface ? t.meta.gameTitle : t.meta.gameTitleNoSurface, {
    ...shared,
    when: `${formatGameDateShort(game.starts_at, locale)} ${formatTime(game.starts_at, locale)}`,
  });

  const description = fillTemplate(t.meta.gameDescription, {
    ...shared,
    // Mid-sentence in the description, so "Indoor" reads "indoor"; scripts without case are unchanged.
    surface: surface.toLocaleLowerCase(),
    // The match-up on court: a stored `5v5v5` (three teams taking turns) reads "5v5", as it does on the card badge.
    format: courtFormat(game.format) ?? "",
    date: formatGameDate(game.starts_at, locale),
    time: formatTime(game.starts_at, locale),
    minutes: String(resolveDurationMinutes(game.duration_minutes)),
    price: formatThb(game.price_thb),
  });

  return { title: tidy(title), description: tidy(description) };
}

/** An empty slot leaves a double space or a leading one; close them and start the line with a capital. */
function tidy(line: string): string {
  const closed = line.replace(/\s{2,}/g, " ").trim();
  return closed.charAt(0).toLocaleUpperCase() + closed.slice(1);
}
