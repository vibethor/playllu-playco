/**
 * How a game's players split into teams, read from its format and its places (owner, 17 Nov 2026: the beach game
 * "says 5v5 but it's 3 teams rotation").
 *
 * Two sources, in order:
 *   - a format with three or more equal sides (`6v6v6`) says the teams outright;
 *   - a two-sided format (`5v5`) with places for more than two teams means extra teams waiting their turn:
 *     fifteen places at five a side is three teams, one rotating in.
 *
 * Uneven sides (`5v4`) or no format say nothing: a team count is not invented from a shape that does not give one.
 */
export interface TeamSetup {
  perTeam: number;
  teams: number;
  /** More teams than fit on the court at once, so they take turns. */
  rotating: boolean;
}

const SIDES_ON_COURT = 2;

export function teamSetup(format: string | null, capacity: number): TeamSetup | null {
  if (!format) return null;
  const sides = format.split("v").map(Number);
  if (sides.length < SIDES_ON_COURT || sides.some((side) => !Number.isInteger(side) || side <= 0)) return null;

  const perTeam = sides[0]!;
  if (sides.some((side) => side !== perTeam)) return null;

  const teams = Math.max(sides.length, Math.floor(capacity / perTeam));
  return { perTeam, teams, rotating: teams > SIDES_ON_COURT };
}
