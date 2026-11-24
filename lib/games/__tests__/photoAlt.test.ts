import { describe, expect, it } from "vitest";
import { venuePhotoAlt } from "@/lib/games/photoAlt";
import { resolveStrings } from "@/lib/i18n/resolve";

/**
 * WHAT A GAME CARD'S PHOTOGRAPH IS CALLED (SEO audit, 24 Nov 2026). Every card photo had `alt=""`, so the venue
 * photographs — the only real pictures of the courts on the site — said nothing to an image search or a screen
 * reader. The default photo is decoration and stays silent.
 */
describe("the alt text of a game card's photo", () => {
  const en = resolveStrings("en");

  it("names the venue and the surface for a venue's own photograph", () => {
    // Act
    const alt = venuePhotoAlt({ venue: "Swish Elite 50", surface: "indoor", isVenuePhoto: true }, en);

    // Assert
    expect(alt).toBe("Swish Elite 50, indoor volleyball court");
  });

  it("names the venue alone when the game has no surface", () => {
    // Act
    const alt = venuePhotoAlt({ venue: "Swish Elite 50", surface: null, isVenuePhoto: true }, en);

    // Assert
    expect(alt).toBe("Swish Elite 50, volleyball court");
  });

  it("is empty for the default photo, which shows no particular place", () => {
    // Act
    const alt = venuePhotoAlt({ venue: "Swish Elite 50", surface: "indoor", isVenuePhoto: false }, en);

    // Assert
    expect(alt).toBe("");
  });

  it("is written in Thai for a Thai reader", () => {
    // Act
    const alt = venuePhotoAlt({ venue: "Swish Elite 50", surface: "sand", isVenuePhoto: true }, resolveStrings("th"));

    // Assert
    expect(alt).toContain("Swish Elite 50");
    expect(alt).not.toMatch(/volleyball court/);
  });
});
