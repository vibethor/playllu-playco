import type { BookingSeatValue } from "@/lib/types/database";

/**
 * Revenue by how it was paid, for a set of games (round 42, the admin
 * rebuild).
 *
 * The owner: "we also need to distinguish between someone purchasing a single
 * credit or using a credit from a game pass that'd make their entry cheaper".
 * What each booking was WORTH is SQL's answer (`booking_seat_values`, rules in
 * `20261108100000_pitch_costs.sql`): a single game at the game's price, a pass
 * Credit at the pass price over its games, other Credits at what was paid, a
 * gift at nothing, money kept from a late cancellation at what was kept. This
 * only adds those answers up, and prices the pass discount — what the cheaper
 * entry cost him — against each game's own price.
 *
 * Pure; the page reads the rows and hands them in.
 */
export interface MixLine {
  seats: number;
  thb: number;
}

export interface RevenueMix {
  single: MixLine;
  pass: MixLine;
  credit: MixLine;
  /** Money kept from cancellations that returned nothing, and how many did. */
  kept: { thb: number; cancellations: number };
  /** Seats that brought no money: admin gifts, seed bookings. */
  freeSeats: number;
  totalThb: number;
  avgSingleThb: number | null;
  avgPassThb: number | null;
  /** How much less a pass seat brought than a single one, on average. */
  passGapPerSeatThb: number | null;
  /** What the pass seats would have brought at their games' price, less what they did. */
  passGapTotalThb: number;
}

function perSeat(line: MixLine): number | null {
  return line.seats > 0 ? line.thb / line.seats : null;
}

export function revenueMix(
  values: readonly BookingSeatValue[],
  priceByGame: ReadonlyMap<string, number>,
): RevenueMix {
  const single: MixLine = { seats: 0, thb: 0 };
  const pass: MixLine = { seats: 0, thb: 0 };
  const credit: MixLine = { seats: 0, thb: 0 };
  const kept = { thb: 0, cancellations: 0 };
  let freeSeats = 0;
  let passGapTotalThb = 0;

  for (const value of values) {
    single.seats += value.single_seats;
    single.thb += value.single_thb;
    pass.seats += value.pass_seats;
    pass.thb += value.pass_thb;
    credit.seats += value.credit_seats;
    credit.thb += value.credit_thb;
    freeSeats += value.free_seats;
    if (value.kept_thb > 0) {
      kept.thb += value.kept_thb;
      kept.cancellations += 1;
    }
    if (value.pass_seats > 0) {
      passGapTotalThb += value.pass_seats * (priceByGame.get(value.game_id) ?? 0) - value.pass_thb;
    }
  }

  const avgSingleThb = perSeat(single);
  const avgPassThb = perSeat(pass);

  return {
    single,
    pass,
    credit,
    kept,
    freeSeats,
    totalThb: single.thb + pass.thb + credit.thb + kept.thb,
    avgSingleThb,
    avgPassThb,
    passGapPerSeatThb: avgSingleThb !== null && avgPassThb !== null ? avgSingleThb - avgPassThb : null,
    passGapTotalThb,
  };
}
