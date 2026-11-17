import { describe, expect, it } from "vitest";
import { teamSetup } from "@/lib/games/teams";

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
