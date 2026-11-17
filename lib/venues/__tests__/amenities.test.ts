import { describe, expect, it } from "vitest";
import { AMENITIES, INCLUDED_AMENITIES, PITCH_AMENITIES, amenityItems } from "@/lib/venues/amenities";
import { th } from "@/lib/i18n/th";

/**
 * VOLLEYBALL, NOT FOOTBALL (owner, 17 Nov 2026): what a venue provides is "balls, game organizer"; its amenities
 * are "showers, parking, drinks, snacks, changing rooms, wifi, towel rental".
 */
describe("venue amenities", () => {
  it("offers balls and a game organizer as what the venue provides", () => {
    // Assert
    expect([...INCLUDED_AMENITIES]).toEqual(["balls", "organizer"]);
  });

  it("offers the owner's seven venue amenities", () => {
    // Assert
    expect([...PITCH_AMENITIES]).toEqual([
      "showers",
      "parking",
      "drinks",
      "snacks",
      "changing_rooms",
      "wifi",
      "towel_rental",
    ]);
  });

  it("no longer shows a football value an old venue row still holds", () => {
    // Act
    const items = amenityItems(["bibs", "balls", "lockers", "towel_rental"]);

    // Assert
    expect(items.map((item) => item.key)).toEqual(["balls", "towel_rental"]);
  });

  it("names every amenity in Thai too", () => {
    // Act
    const missing = AMENITIES.filter((key) => !th.games?.amenities?.[key]);

    // Assert
    expect(missing).toEqual([]);
  });
});
