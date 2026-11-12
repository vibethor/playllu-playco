import { createServiceRoleSupabaseClient } from "@/lib/supabase/clients";
import type { BookingSeatValue, GameEconomicsRow, PitchSeason } from "@/lib/types/database";

/**
 * What a pitch costs and what each game made (round 42, the admin rebuild).
 *
 * The owner: "I do want the profit and break-even per game", telling "someone
 * purchasing a single credit" from "a credit from a game pass that'd make their
 * entry cheaper". The arithmetic lives in SQL — `booking_seat_values` and
 * `game_economics` — and this file only reads it, so the games list, the game
 * page and the money page cannot disagree about what a seat was worth.
 *
 * READS ONLY, ON THE SERVICE ROLE, for the reason `lib/admin/queries.ts` gives;
 * and the pitch tables are not readable by anybody else at all. Every caller
 * checks `app_capabilities().pitchCosts` first: before the migration none of
 * these objects exist, and PostgREST answers a missing function with a 404.
 */

export interface GameEconomics {
  gameId: string;
  priceThb: number;
  capacity: number;
  seatsTaken: number;
  houseGuests: number;
  /** Seats held by bookings that have not paid (cash at the pitch, legacy QR). */
  unpaidSeats: number;
  /** Games paid on their own — card, QR, cash — at the game's price. */
  singleSeats: number;
  /** Seats paid with a Game Pass Credit, worth the pass price over its games. */
  passSeats: number;
  /** Seats paid with other Credits — refunds, top-ups, recorded transfers. */
  creditSeats: number;
  /** Admin gifts and seed bookings: a seat, no money. */
  freeSeats: number;
  singleThb: number;
  passThb: number;
  creditThb: number;
  /** Kept from late cancellations and removals that returned nothing. */
  keptThb: number;
  /** What unpaid bookings still owe. Not revenue. */
  owedThb: number;
  revenueThb: number;
  /** Null when the game has no venue — and then no profit or break-even either. */
  pitchCostThb: number | null;
  profitThb: number | null;
  breakEvenSeats: number | null;
}

export function toGameEconomics(row: GameEconomicsRow): GameEconomics {
  return {
    gameId: row.game_id,
    priceThb: row.price_thb,
    capacity: row.capacity,
    seatsTaken: row.seats_taken,
    houseGuests: row.house_guests,
    unpaidSeats: Number(row.unpaid_seats),
    singleSeats: Number(row.single_seats),
    passSeats: Number(row.pass_seats),
    creditSeats: Number(row.credit_seats),
    freeSeats: Number(row.free_seats),
    singleThb: Number(row.single_thb),
    passThb: Number(row.pass_thb),
    creditThb: Number(row.credit_thb),
    keptThb: Number(row.kept_thb),
    owedThb: row.owed_thb,
    revenueThb: Number(row.revenue_thb),
    pitchCostThb: row.pitch_cost_thb,
    profitThb: row.profit_thb === null ? null : Number(row.profit_thb),
    breakEvenSeats: row.break_even_seats,
  };
}

/** Economics for each of these games, keyed by game id. */
export async function getGameEconomics(gameIds: string[]): Promise<Map<string, GameEconomics>> {
  if (gameIds.length === 0) return new Map();
  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service.rpc("game_economics", { p_game_ids: gameIds });
  if (error) throw new Error(`game_economics failed: ${error.message}`, { cause: error });
  return new Map((data ?? []).map((row) => [row.game_id, toGameEconomics(row)]));
}

/** What every booking on these games earned, by how it was paid. */
export async function getBookingSeatValues(gameIds: string[]): Promise<BookingSeatValue[]> {
  if (gameIds.length === 0) return [];
  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service.rpc("booking_seat_values", { p_game_ids: gameIds });
  if (error) throw new Error(`booking_seat_values failed: ${error.message}`, { cause: error });
  return (data ?? []).map((row) => ({
    ...row,
    seats: Number(row.seats),
    single_seats: Number(row.single_seats),
    pass_seats: Number(row.pass_seats),
    credit_seats: Number(row.credit_seats),
    free_seats: Number(row.free_seats),
    unpaid_seats: Number(row.unpaid_seats),
    single_thb: Number(row.single_thb),
    pass_thb: Number(row.pass_thb),
    credit_thb: Number(row.credit_thb),
    kept_thb: Number(row.kept_thb),
  }));
}

/** The season new games take their pitch cost for. */
export async function getPitchSeason(): Promise<PitchSeason> {
  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service.from("pitch_settings").select("season").eq("id", "singleton").maybeSingle();
  if (error) throw new Error(`pitch_settings read failed: ${error.message}`, { cause: error });
  return data?.season === "summer" ? "summer" : "winter";
}

export interface VenuePitchCost {
  summerThb: number;
  winterThb: number;
}

/** Every venue's summer and winter pitch cost, keyed by venue id. */
export async function getVenuePitchCosts(): Promise<Map<string, VenuePitchCost>> {
  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service.from("venue_pitch_costs").select("venue_id, summer_thb, winter_thb");
  if (error) throw new Error(`venue_pitch_costs read failed: ${error.message}`, { cause: error });
  return new Map(
    (data ?? []).map((row) => [row.venue_id, { summerThb: row.summer_thb, winterThb: row.winter_thb }]),
  );
}

export interface GamePitchCost {
  costThb: number;
  /** True when an admin typed it; false when it came from the venue and season. */
  setByHand: boolean;
}

/** One game's pitch cost, or null for a game with no venue. */
export async function getGamePitchCost(gameId: string): Promise<GamePitchCost | null> {
  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service
    .from("game_pitch_costs")
    .select("cost_thb, set_by_hand")
    .eq("game_id", gameId)
    .maybeSingle();
  if (error) throw new Error(`game_pitch_costs read failed: ${error.message}`, { cause: error });
  return data ? { costThb: data.cost_thb, setByHand: data.set_by_hand } : null;
}
