import { describe, expect, it } from "vitest";
import { cityInputValue, instantFromCityInput, weeklyRepeatLabel } from "@/lib/admin/startsAtInput";

/*
 * The game form's start time, in the CITY's time zone (DEFAULT_CITY, Asia/Bangkok, UTC+7 with no DST).
 *
 * Why it matters (18 Nov 2026): the form read the time in whatever zone the code ran in. Vercel renders in UTC and the
 * organiser's browser is in Bangkok, so the server and the browser drew different text, React threw away the server
 * HTML, and after a save the dropdowns reset to their first option. One zone on both sides removes the mismatch.
 */
describe("cityInputValue", () => {
  it("writes an instant as the city's wall clock for a datetime-local box", () => {
    // Arrange
    const startsAt = "2026-11-22T10:00:00+00:00";

    // Act
    const value = cityInputValue(startsAt);

    // Assert
    expect(value).toBe("2026-11-22T17:00");
  });

  it("returns an empty box for a value that is not a date", () => {
    // Arrange
    const startsAt = "not a date";

    // Act
    const value = cityInputValue(startsAt);

    // Assert
    expect(value).toBe("");
  });
});

describe("instantFromCityInput", () => {
  it("reads the box as the city's wall clock, whatever zone the browser is in", () => {
    // Arrange
    const typed = "2026-11-22T17:00";

    // Act
    const iso = instantFromCityInput(typed);

    // Assert
    expect(iso).toBe("2026-11-22T10:00:00.000Z");
  });

  it("round-trips with cityInputValue", () => {
    // Arrange
    const startsAt = "2026-12-31T23:30:00.000Z";

    // Act
    const back = instantFromCityInput(cityInputValue(startsAt));

    // Assert
    expect(back).toBe(startsAt);
  });

  it("returns null for an empty or malformed box", () => {
    // Arrange
    const typed = ["", "2026-11-22", "17:00", "2026-13-40T99:99"];

    // Act
    const results = typed.map(instantFromCityInput);

    // Assert
    expect(results).toEqual([null, null, null, null]);
  });
});

describe("weeklyRepeatLabel", () => {
  it("names the weekday and time the series repeats on, in the city", () => {
    // Arrange
    const startsAt = "2026-11-22T10:00:00.000Z";

    // Act
    const label = weeklyRepeatLabel(startsAt);

    // Assert
    expect(label).toEqual({ weekday: "Sunday", time: "17:00" });
  });

  it("returns null without a valid start", () => {
    // Arrange
    const startsAt = "";

    // Act
    const label = weeklyRepeatLabel(startsAt);

    // Assert
    expect(label).toBeNull();
  });
});
