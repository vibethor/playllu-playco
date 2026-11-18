import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Recurring games (owner, 18 Nov 2026) — "Make this game recurring?" on the game form.
 *
 * The database does the work: `set_game_repeats_weekly` ticks the game (and every later copy of it), and
 * `extend_weekly_games` creates and publishes next week's copy of every live series until the next one is more than
 * `WEEKLY_HORIZON_DAYS` away, so it is always on the 1-week list. The admin action calls both straight away; the daily
 * cron `/api/cron/weekly-games` keeps the series rolling.
 *
 * TOLERANT OF A DATABASE WITHOUT THE MIGRATION. Until `20261118100000_playco_weekly_games.sql` is applied, both RPCs
 * are missing; the form still saves the game and the tick is simply not stored. Nothing here throws.
 */
export const WEEKLY_HORIZON_DAYS = 8;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any, any, any>;

export async function applyRepeatsWeekly(
  supabase: AnyClient,
  gameId: string,
  repeats: boolean,
): Promise<void> {
  const { error } = await supabase.rpc("set_game_repeats_weekly", {
    p_game_id: gameId,
    p_repeats: repeats,
  });
  if (error) {
    console.error("set_game_repeats_weekly failed", error.message);
    return;
  }
  if (repeats) await extendWeeklyGames(supabase);
}

export async function extendWeeklyGames(supabase: AnyClient): Promise<number | null> {
  const { data, error } = await supabase.rpc("extend_weekly_games", {
    p_horizon_days: WEEKLY_HORIZON_DAYS,
  });
  if (error) {
    console.error("extend_weekly_games failed", error.message);
    return null;
  }
  return typeof data === "number" ? data : 0;
}

/** Whether this game repeats weekly; false when the column does not exist yet. */
export async function readRepeatsWeekly(supabase: AnyClient, gameId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("games")
    .select("repeats_weekly")
    .eq("id", gameId)
    .maybeSingle();
  if (error || !data) return false;
  return (data as { repeats_weekly?: boolean }).repeats_weekly === true;
}
