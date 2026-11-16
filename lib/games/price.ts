/*
 * A LEAF MODULE, AND THE RELATIVE IMPORT IS WHY (round 16, item 20's lesson
 * applied again). `scripts/fixtures.ts` is run by a plain node ESM loader with
 * no `@/` alias, so an aliased import here breaks the seed — which is how this
 * file first reached the seed and failed. `lib/pass/creditPrice` is itself a
 * leaf.
 */
import { PASS_REFERENCE_PRICE_THB } from "../pass/creditPrice.ts";

/**
 * What the admin form PREFILLS as a game's price (round 40).
 *
 * A GAME IS ONE CREDIT, WHATEVER ITS LENGTH. The owner removed the 150 THB
 * hour, and the lawyer's terms make every booking a Credit (Obchodní podmínky
 * 5.1): buying a single game IS buying one Credit, spent on that game at once.
 * So every length prefills the Credit price, and a Credit pays for a game of
 * any length — `credit_seat_minutes()` and `gameTakesCredit()` are gone with
 * the 90-minute rule they encoded.
 *
 * `public.price_for_duration()` mirrors this in SQL and CALLS
 * `credit_seat_price_thb()` rather than restating 180 — one price, one place
 * per side. The organizer can still type another number (round 36).
 *
 * The parameter stays so the form's call site still reads as "the length
 * suggests the price", and so a future length-dependent price is an edit here
 * rather than a hunt for every caller.
 */
/** PLAYCO, PHASE F: games longer than this prefill the long-game price (the 3-hour Sunday game). */
export const LONG_GAME_THRESHOLD_MINUTES = 120;
/** PLAYCO, PHASE F: what a long game prefills. Beach games are also 300; the organiser types it. */
export const LONG_GAME_PRICE_THB = 300;

export function priceForDurationThb(minutes: number | null | undefined): number {
  if (minutes != null && minutes > LONG_GAME_THRESHOLD_MINUTES) return LONG_GAME_PRICE_THB;
  return PASS_REFERENCE_PRICE_THB;
}
