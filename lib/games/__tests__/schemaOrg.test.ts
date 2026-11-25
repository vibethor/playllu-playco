import { describe, expect, it } from "vitest";
import { DEFAULT_SPORT } from "@/lib/city/default";
import { gameEventSchema } from "@/lib/games/schemaOrg";
import { policy } from "@/lib/policy";
import type { Database } from "@/lib/types/database";

type GameRow = Database["public"]["Tables"]["games"]["Row"];

const game: GameRow = {
  id: "11111111-1111-1111-1111-111111111111",
  venue: "Prazacka",
  venue_id: "22222222-2222-2222-2222-222222222222",
  starts_at: "2026-08-01T17:00:00.000Z",
  capacity: 12,
  price_thb: 200,
  status: "published",
  guest_count: 0,
  format: "6v6",
  surface: "turf",
  notes: null,
  city: "Prague",
  brand: "hrajfotbal",
  created_at: "2026-07-01T09:00:00.000Z",
  duration_minutes: null,
  allowed_skill_levels: null,
  subs_per_team: null,
  // Migration 41. Null means the venue's own pitch name is used.
  pitch_name: null,
};

const base = {
  game,
  spotsLeft: 3,
  url: "https://hrajfotbal.com/game/11111111-1111-1111-1111-111111111111",
  venueName: "Prazacka",
  city: "Prague",
};

/**
 * REQ-GAME-008 — the endDate reads the per-game column.
 *
 * Structured data fails SILENTLY: a consumer that disagrees with the page
 * simply ignores the block, or indexes the wrong end time. These assertions
 * are the only feedback loop this surface has.
 */
describe("gameEventSchema — endDate", () => {
  it("ends at start + the game's own duration when one is recorded", () => {
    const schema = gameEventSchema({
      ...base,
      game: { ...game, duration_minutes: 90 },
    });
    // The same instant as 18:30 UTC, written in the city's clock (24 Nov 2026) rather than in UTC.
    expect(Date.parse(schema.endDate as string)).toBe(Date.parse("2026-08-01T18:30:00.000Z"));
  });

  it("falls back to the policy constant for a game with no duration", () => {
    const schema = gameEventSchema(base);
    const elapsed =
      Date.parse(schema.endDate as string) - Date.parse(schema.startDate as string);
    expect(elapsed).toBe(policy.game.durationMinutes * 60_000);
  });

  it("does not read the constant where a column value exists — 30 and 180 both land", () => {
    for (const minutes of [30, 180]) {
      const schema = gameEventSchema({
        ...base,
        game: { ...game, duration_minutes: minutes },
      });
      const elapsed =
        Date.parse(schema.endDate as string) - Date.parse(schema.startDate as string);
      expect(elapsed).toBe(minutes * 60_000);
    }
  });
});

describe("gameEventSchema", () => {
  it("emits a SportsEvent with the canonical context", () => {
    const schema = gameEventSchema(base);
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("SportsEvent");
  });

  it("prices the offer in THB regardless of anything else, because the QR is an SPD string", () => {
    const offers = gameEventSchema(base).offers as Record<string, unknown>;
    expect(offers.price).toBe(200);
    expect(offers.priceCurrency).toBe("THB");
  });

  it("reports InStock while spots remain and SoldOut at zero", () => {
    const open = gameEventSchema(base).offers as Record<string, unknown>;
    const full = gameEventSchema({ ...base, spotsLeft: 0 }).offers as Record<string, unknown>;
    expect(open.availability).toBe("https://schema.org/InStock");
    expect(full.availability).toBe("https://schema.org/SoldOut");
  });

  it("derives endDate from the policy duration, since games has no ends_at column", () => {
    const schema = gameEventSchema(base);
    const start = new Date(schema.startDate as string).getTime();
    const end = new Date(schema.endDate as string).getTime();
    expect((end - start) / 60_000).toBe(policy.game.durationMinutes);
  });

  it("announces a cancelled game as cancelled — its link is still circulating", () => {
    const schema = gameEventSchema({ ...base, game: { ...game, status: "cancelled" } });
    expect(schema.eventStatus).toBe("https://schema.org/EventCancelled");
  });

  it("carries the capacity numbers the page renders", () => {
    const schema = gameEventSchema(base);
    expect(schema.maximumAttendeeCapacity).toBe(12);
    expect(schema.remainingAttendeeCapacity).toBe(3);
  });

  it("leads the name with the format when the organizer set one", () => {
    expect(gameEventSchema(base).name).toContain("6v6");
    expect(gameEventSchema({ ...base, game: { ...game, format: null } }).name).not.toContain(
      "6v6",
    );
  });

  it("survives JSON serialization with no undefined holes", () => {
    const serialized = JSON.stringify(gameEventSchema(base));
    expect(serialized).not.toContain("undefined");
    expect(JSON.parse(serialized)).toMatchObject({ "@type": "SportsEvent" });
  });
});

describe("gameEventSchema — the sport and the picture", () => {
  it("names the sport Playco plays, not the football the fork came from", () => {
    // Act
    const schema = gameEventSchema(base);

    // Assert
    expect(schema.sport).toBe(DEFAULT_SPORT);
    expect(schema.sport).not.toBe("Football");
  });

  it("carries the game's share image when the page passes one", () => {
    // Arrange
    const image = `${base.url}/opengraph-image`;

    // Act
    const schema = gameEventSchema({ ...base, image });

    // Assert
    expect(schema.image).toEqual([image]);
  });
});

/**
 * SEO audit, 24 Nov 2026. Production said `"name":"6v6 · Swish Elite 50 · Playco"`, a start time ending in `Z`
 * and an address of `{"addressLocality":"bangkok"}`: all valid, none of it enough for an event listing.
 */
describe("gameEventSchema — what an event listing needs", () => {
  const bangkokGame: GameRow = {
    ...game,
    venue: "Swish Elite 50",
    city: "bangkok",
    surface: "indoor",
    starts_at: "2026-11-29T10:00:00.000Z",
    duration_minutes: 120,
  };
  const bangkok = { ...base, game: bangkokGame, venueName: "Swish Elite 50", city: "bangkok" };

  it("names the event by format, surface, sport and venue", () => {
    // Act
    const schema = gameEventSchema(bangkok);

    // Assert
    expect(schema.name).toBe("6v6 indoor pickup volleyball at Swish Elite 50");
  });

  it("starts the name with a capital when the game has no format", () => {
    // Act
    const schema = gameEventSchema({ ...bangkok, game: { ...bangkokGame, format: null, surface: "sand" } });

    // Assert
    expect(schema.name).toBe("Beach pickup volleyball at Swish Elite 50");
  });

  it("gives the start and the end in the city's own clock, with its offset", () => {
    // Act
    const schema = gameEventSchema(bangkok);

    // Assert
    expect(schema.startDate).toBe("2026-11-29T17:00:00+07:00");
    expect(schema.endDate).toBe("2026-11-29T19:00:00+07:00");
  });

  it("prints the city's name and its country, not the slug the row carries", () => {
    // Act
    const { address } = gameEventSchema(bangkok).location as { address: Record<string, unknown> };

    // Assert
    expect(address.addressLocality).toBe("Bangkok");
    expect(address.addressCountry).toBe("TH");
  });

  it("carries the venue's street address and its pin when the venue row has them", () => {
    // Arrange
    const venueAddress = " 48 Soi Sukhumvit 16, Khlong Toei, Bangkok 10110 ";
    const coordinates = { lat: 13.7311, lng: 100.5601 };

    // Act
    const location = gameEventSchema({ ...bangkok, venueAddress, coordinates }).location as Record<string, unknown>;

    // Assert
    expect((location.address as Record<string, unknown>).streetAddress).toBe(venueAddress.trim());
    expect(location.geo).toEqual({ "@type": "GeoCoordinates", latitude: 13.7311, longitude: 100.5601 });
  });

  it("leaves the street address and the pin out when the venue has neither, rather than inventing them", () => {
    // Act
    const location = gameEventSchema({ ...bangkok, venueAddress: "  ", coordinates: null }).location as Record<
      string,
      unknown
    >;

    // Assert
    expect(location.address).not.toHaveProperty("streetAddress");
    expect(location).not.toHaveProperty("geo");
  });

  it("describes this game when the page hands it a description, and the site otherwise", () => {
    // Arrange
    const description = "6v6 indoor pickup volleyball at Swish Elite 50, Bangkok.";

    // Act
    const described = gameEventSchema({ ...bangkok, description });
    const plain = gameEventSchema(bangkok);

    // Assert
    expect(described.description).toBe(description);
    expect(plain.description).not.toBe(description);
  });

  it("shows the venue's photograph beside the share image", () => {
    // Arrange
    const image = `${base.url}/opengraph-image`;
    const venuePhoto = "https://example.supabase.co/storage/v1/object/public/venue-photos/venues/v.webp";

    // Act
    const schema = gameEventSchema({ ...bangkok, image, venuePhoto });

    // Assert
    expect(schema.image).toEqual([image, venuePhoto]);
  });
});

// Jachym, 24 Nov 2026: "it should just say 5v5". A stored `5v5v5` is three teams taking turns, five a side on court.
describe("the event's name for a game with a team waiting its turn", () => {
  it("names the match-up on court, not three sides", () => {
    // Arrange
    const rotating = { ...base, game: { ...game, format: "5v5v5", surface: "sand" as const }, venueName: "Asoke Sports Club" };

    // Act
    const schema = gameEventSchema(rotating);

    // Assert
    expect(schema.name).toBe("5v5 beach pickup volleyball at Asoke Sports Club");
  });
});
