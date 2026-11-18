import { describe, expect, it } from "vitest";
import { courtFormat, teamSetup } from "@/lib/games/teams";

/**
 * THE FORMAT, SAID PROPERLY (owner, 17 Nov 2026): the beach game "says 5v5 but it's 3 teams rotation". Fifteen
 * players at five a side is three teams, one sitting out and rotating in. The game page says so.
 */
describe("teamSetup", () => {
  it("reads three teams rotating from 5v5 with fifteen places", () => {
    // Act
    const setup = teamSetup("5v5", 15);

    // Assert
    expect(setup).toEqual({ perTeam: 5, teams: 3, rotating: true });
  });

  it("reads a three-way format as three teams rotating", () => {
    // Act
    const setup = teamSetup("6v6v6", 18);

    // Assert
    expect(setup).toEqual({ perTeam: 6, teams: 3, rotating: true });
  });

  it("is two teams, no rotation, when the places fill exactly two sides", () => {
    // Act
    const setup = teamSetup("6v6", 12);

    // Assert
    expect(setup).toEqual({ perTeam: 6, teams: 2, rotating: false });
  });

  it("has nothing to say without a format", () => {
    // Act
    const setup = teamSetup(null, 15);

    // Assert
    expect(setup).toBeNull();
  });

  it("does not invent teams from uneven sides", () => {
    // Act
    const setup = teamSetup("5v4", 15);

    // Assert
    expect(setup).toBeNull();
  });
});

/*
 * THE BADGE SAYS WHO IS ON COURT (owner, 18 Nov 2026): "when I select 3 teams, on the game card it should say just
 * 5v5, and in the description it should say it's 3 teams". The stored format stays `5v5v5`; the badge shows one
 * match-up and the game page's Format row adds "3 teams of 5, rotating" (`teamSetup`).
 */
describe("courtFormat", () => {
  it("shows a three-team rotation as one match-up", () => {
    // Arrange
    const stored = "5v5v5";

    // Act
    const badge = courtFormat(stored);

    // Assert
    expect(badge).toBe("5v5");
  });

  it("shows four teams the same way", () => {
    // Arrange
    const stored = "6v6v6v6";

    // Act
    const badge = courtFormat(stored);

    // Assert
    expect(badge).toBe("6v6");
  });

  it("leaves a two-team format as it is", () => {
    // Arrange
    const stored = "6v6";

    // Act
    const badge = courtFormat(stored);

    // Assert
    expect(badge).toBe("6v6");
  });

  it("leaves an uneven format untouched rather than guessing", () => {
    // Arrange
    const stored = "5v6v5";

    // Act
    const badge = courtFormat(stored);

    // Assert
    expect(badge).toBe("5v6v5");
  });

  it("returns null for no format", () => {
    // Arrange
    const stored = null;

    // Act
    const badge = courtFormat(stored);

    // Assert
    expect(badge).toBeNull();
  });
});
