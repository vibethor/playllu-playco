import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { extendWeeklyGames } from "@/lib/admin/weeklyGames";
import { rejectUnauthorizedCron } from "@/lib/cron/guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/clients";

export const dynamic = "force-dynamic";

/**
 * Daily: create and publish next week's copy of every recurring game (owner, 18 Nov 2026).
 * The work and its idempotence live in `extend_weekly_games`; a second run the same day makes nothing.
 */
export async function GET(request: Request) {
  const unauthorized = rejectUnauthorizedCron(request);
  if (unauthorized) return unauthorized;

  const supabase = createServiceRoleSupabaseClient();
  const created = await extendWeeklyGames(supabase);
  if (created === null) return NextResponse.json({ available: false, created: 0 });

  if (created > 0) {
    revalidatePath("/games");
    revalidatePath("/");
    revalidatePath("/admin/games");
  }
  return NextResponse.json({ available: true, created });
}
