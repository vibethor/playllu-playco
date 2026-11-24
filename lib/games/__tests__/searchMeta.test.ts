import { describe, expect, it } from "vitest";
import { gameSearchMeta } from "@/lib/games/searchMeta";
import { resolveStrings } from "@/lib/i18n/resolve";

// Sunday 29 November 2026, 17:00 in the city (10:00 UTC).
const SUNDAY_GAME = {
  venue: "Swish Elite 50",
  starts_at: "2026-11-29T10:00:00.000Z",
  duration_minutes: 120,
  price_thb: 300,
  format: "6v6",
  surface: "indoor",
} as const;

describe("a game page's title and description in a search result", () => {
  it("leads the title with the surface and the sport, then the venue, the city and a short date", () => {
    // Act
    const { title } = gameSearchMeta(SUNDAY_GAME, "en", resolveStrings("en"));

    // Assert
    expect(title).toBe("Indoor volleyball at Swish Elite 50, Bangkok · Sun 29 Nov 17:00");
  });

  it("calls a sand game beach volleyball", () => {
    // Act
    const { title } = gameSearchMeta({ ...SUNDAY_GAME, surface: "sand" }, "en", resolveStrings("en"));

    // Assert
    expect(title).toMatch(/^Beach volleyball at /);
  });

  it("starts the title with the sport when the game has no surface", () => {
    // Act
    const { title } = gameSearchMeta({ ...SUNDAY_GAME, surface: null }, "en", resolveStrings("en"));

    // Assert
    expect(title).toBe("Volleyball at Swish Elite 50, Bangkok · Sun 29 Nov 17:00");
  });

  it("describes the game in a sentence: format, surface, venue, day, time, length and price", () => {
    // Act
    const { description } = gameSearchMeta(SUNDAY_GAME, "en", resolveStrings("en"));

    // Assert
    expect(description).toBe(
      "6v6 indoor pickup volleyball at Swish Elite 50, Bangkok, Sunday 29 November at 17:00. 120 minutes, 300 THB. Book a spot online and pay by card or PromptPay.",
    );
  });

  it("fits the description in the 160 characters a result shows", () => {
    // Act
    const { description } = gameSearchMeta(SUNDAY_GAME, "en", resolveStrings("en"));

    // Assert
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it("says nothing about spots left, which would be stale in a result within the hour", () => {
    // Act
    const { title, description } = gameSearchMeta(SUNDAY_GAME, "en", resolveStrings("en"));

    // Assert
    expect(`${title} ${description}`).not.toMatch(/spots? left/i);
  });

  it("reads cleanly with neither a format nor a surface", () => {
    // Act
    const { description } = gameSearchMeta(
      { ...SUNDAY_GAME, format: null, surface: null },
      "en",
      resolveStrings("en"),
    );

    // Assert
    expect(description).toMatch(/^Pickup volleyball at Swish Elite 50, Bangkok, /);
    expect(description).not.toMatch(/ {2}/);
  });

  it("falls back to the policy length for a game with no recorded duration", () => {
    // Act
    const { description } = gameSearchMeta({ ...SUNDAY_GAME, duration_minutes: null }, "en", resolveStrings("en"));

    // Assert
    expect(description).toMatch(/\d+ minutes/);
  });

  it("is written in Thai for a Thai reader, with the venue and the price intact", () => {
    // Act
    const { title, description } = gameSearchMeta(SUNDAY_GAME, "th", resolveStrings("th"));

    // Assert
    expect(title).toContain("วอลเลย์บอลในร่ม");
    expect(title).toContain("Swish Elite 50");
    expect(description).toContain("300 THB");
    expect(`${title}${description}`).not.toMatch(/\{[a-zA-Z]+\}/);
  });
});
