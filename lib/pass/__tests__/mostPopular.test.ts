import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MOST_POPULAR_GAMES } from "@/lib/pass/queries";

/**
 * "Most popular" is a ruling, not a measurement, so it is a constant. The tiers it can point at are the ones the
 * Playco pass migration sells (Jachym, 19 Nov 2026: 5, 8, 12 and 20 games). A constant naming a tier nobody can buy
 * shows the badge on nothing, silently.
 */
const PASS_MIGRATION = "supabase/migrations/20261119100000_playco_pass_tiers_v2.sql";

function soldTiers(): number[] {
  const sql = readFileSync(join(process.cwd(), PASS_MIGRATION), "utf8");
  const values = sql.slice(sql.indexOf("values"), sql.indexOf("on conflict"));
  return [...values.matchAll(/\(\s*(\d+),\s*\d+,/g)].map((m) => Number(m[1]));
}

describe("the most-popular pass", () => {
  it("is one of the passes Playco sells", () => {
    // Arrange
    const tiers = soldTiers();

    // Act / Assert
    expect(tiers).toEqual([5, 8, 12, 20]);
    expect(tiers).toContain(MOST_POPULAR_GAMES);
  });

  it("is the 12-game pass", () => {
    // Act / Assert
    expect(MOST_POPULAR_GAMES).toBe(12);
  });
});
