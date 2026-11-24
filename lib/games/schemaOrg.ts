import type { Database } from "@/lib/types/database";
import { DEFAULT_CITY, DEFAULT_SPORT, SITE_NAME, cityNameOf } from "@/lib/city/default";
import { formatIsoInCity } from "@/lib/format";
import { gameEndsAt } from "@/lib/games/duration";
import { strings } from "@/lib/strings";

type GameRow = Database["public"]["Tables"]["games"]["Row"];

/**
 * schema.org `Event` markup for a game page.
 *
 * Game links are shared in WhatsApp and pasted into Google. The Open Graph
 * tags (Phase 13) already own how the link *looks* in a chat; this owns what a
 * search engine understands it to *be* — a dated, located, priced event with a
 * ticket count, which is the difference between a blue link and a result with
 * the kick-off time on it.
 *
 * Kept as a pure function so it is unit-testable without rendering: the
 * failure mode of structured data is silent (a bad `offers` block is simply
 * ignored by the consumer), so the assertions here are the only feedback loop.
 */

/** schema.org availability, as the vocabulary spells it. */
const IN_STOCK = "https://schema.org/InStock";
const SOLD_OUT = "https://schema.org/SoldOut";

/**
 * Event status. `cancelled` is the one that matters: a cancelled game whose
 * link is still circulating should announce itself as cancelled rather than
 * quietly disappearing from the index.
 */
function eventStatus(game: GameRow): string {
  return game.status === "cancelled"
    ? "https://schema.org/EventCancelled"
    : "https://schema.org/EventScheduled";
}

/**
 * End time.
 *
 * READS THE PER-GAME COLUMN, falling back to the policy constant only when the
 * organizer stated no duration (§5.2, REQ-GAME-008). Structured data fails
 * SILENTLY — a consumer that disagrees with the page simply ignores the block,
 * or worse, indexes the wrong end time — so this site cannot be the one left
 * on the constant. `gameEndsAt` is the single fallback for all four surfaces.
 */
function endTime(game: GameRow): string {
  return formatIsoInCity(gameEndsAt(game.starts_at, game.duration_minutes));
}

/**
 * "6v6 indoor pickup volleyball at Swish Elite 50" (SEO audit, 24 Nov 2026).
 *
 * ~~`6v6 · Swish Elite 50 · Playco`~~ named neither the sport nor what kind of event this is; the organiser is
 * already its own field. English, like the rest of this block: structured data is read by machines in one language.
 */
function eventName(game: GameRow, venueName: string): string {
  const surface = game.surface ? strings.games.surface[game.surface].toLowerCase() : null;
  const words = [game.format, surface, `pickup ${DEFAULT_SPORT.toLowerCase()} at ${venueName}`].filter(Boolean);
  const name = words.join(" ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export interface GameEventSchemaInput {
  game: GameRow;
  spotsLeft: number;
  /** Absolute URL of the game page — schema.org URLs may not be relative. */
  url: string;
  /** Venue display name, from `venues` when the game has one. */
  venueName: string;
  /** The city slug the game row carries; printed as the city's name. */
  city: string;
  /** The game's share image (absolute). Event results show a picture when given one. */
  image?: string;
  /** The venue's own photograph (absolute), beside the share image. */
  venuePhoto?: string | null;
  /** What the page says about this game in a search result; the sitewide line when absent. */
  description?: string;
  /** The venue's street address as the admin typed it (`venues.address`). */
  venueAddress?: string | null;
  /** The venue's pin (`venues.map_query`, when it holds coordinates). */
  coordinates?: { lat: number; lng: number } | null;
}

export function gameEventSchema({
  game,
  spotsLeft,
  url,
  venueName,
  city,
  image,
  venuePhoto,
  description,
  venueAddress,
  coordinates,
}: GameEventSchemaInput): Record<string, unknown> {
  const brand = SITE_NAME;
  // The format still leads when the game has one: it is what a player scanning results decides on.
  const name = eventName(game, venueName);
  const images = [image, venuePhoto].filter((value): value is string => Boolean(value));
  /*
   * THE ADDRESS IS AS COMPLETE AS THE VENUE ROW IS. A bare `addressLocality` was all this said (measured on
   * production: `{"addressLocality":"bangkok"}`, the slug), which is not enough for an event listing to place the
   * game. The street address is the admin's own line, unparsed: splitting a postcode out of free text would be a
   * guess about one country's format.
   */
  const address: Record<string, unknown> = {
    "@type": "PostalAddress",
    ...(venueAddress?.trim() ? { streetAddress: venueAddress.trim() } : {}),
    addressLocality: cityNameOf(city),
    addressCountry: DEFAULT_CITY.country,
  };

  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name,
    description: description ?? strings.meta.description,
    url,
    startDate: formatIsoInCity(game.starts_at),
    endDate: endTime(game),
    eventStatus: eventStatus(game),
    // Everyone is physically on a pitch; there is no stream.
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    sport: DEFAULT_SPORT,
    ...(images.length > 0 ? { image: images } : {}),
    maximumAttendeeCapacity: game.capacity,
    remainingAttendeeCapacity: spotsLeft,
    location: {
      "@type": "Place",
      name: venueName,
      address,
      ...(coordinates
        ? { geo: { "@type": "GeoCoordinates", latitude: coordinates.lat, longitude: coordinates.lng } }
        : {}),
    },
    organizer: {
      "@type": "Organization",
      name: brand,
      url: new URL("/", url).toString(),
    },
    offers: {
      "@type": "Offer",
      url,
      // Payment is Czech regardless of the language the page is read in — the
      // QR is an SPD string in THB. The currency here is a fact about the
      // money, not about the locale.
      price: game.price_thb,
      priceCurrency: "THB",
      availability: spotsLeft > 0 ? IN_STOCK : SOLD_OUT,
      validFrom: new Date(game.created_at).toISOString(),
    },
  };
}
