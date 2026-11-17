import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DayPicker } from "@/components/game/DayPicker";
import type { DayTab } from "@/lib/games/days";

/**
 * ONLY DAYS WITH GAMES ARE TAPPABLE (owner, 16 Nov 2026): "I only want to be able to click on the days where the
 * games are … make the edges a little bit darker on the days that are clickable." An empty day stays in the row so
 * the calendar can still be counted along, but it is no longer a link to an empty list.
 */
const GAME_DAY: DayTab = { key: "2026-11-19", weekday: "THU", dayOfMonth: "19", count: 1 };
const EMPTY_DAY: DayTab = { key: "2026-11-18", weekday: "WED", dayOfMonth: "18", count: 0 };

/** The opening tag of the element carrying `data-day="<key>"`. */
function cellTag(html: string, key: string): string {
  const match = html.match(new RegExp(`<(\\w+)[^>]*data-day="${key}"[^>]*>`));
  if (!match) throw new Error(`no cell for ${key}`);
  return match[0];
}

function render(selected: string | null = null): string {
  return renderToStaticMarkup(<DayPicker tabs={[EMPTY_DAY, GAME_DAY]} selected={selected} allLabel="All" />);
}

describe("DayPicker", () => {
  it("links a day that has games to that day's list", () => {
    // Act
    const tag = cellTag(render(), GAME_DAY.key);

    // Assert
    expect(tag).toMatch(/^<a /);
    expect(tag).toContain(`href="/games?day=${GAME_DAY.key}"`);
  });

  it("renders a day without games as a disabled cell, not a link", () => {
    // Act
    const tag = cellTag(render(), EMPTY_DAY.key);

    // Assert
    expect(tag).not.toMatch(/^<a /);
    expect(tag).not.toContain("href=");
    expect(tag).toContain('aria-disabled="true"');
  });

  it("gives a day with games the darker edge and an empty day none", () => {
    // Act
    const html = render();

    // Assert
    expect(cellTag(html, GAME_DAY.key)).toContain("border-bone/45");
    expect(cellTag(html, EMPTY_DAY.key)).not.toContain("border-bone/45");
  });

  it("gives All the darker edge while a day is picked (unpicked, it is the lime cell)", () => {
    // Act
    const html = render(GAME_DAY.key);
    const all = html.match(/<a[^>]*data-testid="day-tab-all"[^>]*>/)![0];

    // Assert
    expect(all).toContain("border-bone/45");
  });

  it("keeps a selected day a link, so tapping it again clears the filter even if it has no games", () => {
    // Act
    const tag = cellTag(render(EMPTY_DAY.key), EMPTY_DAY.key);

    // Assert
    expect(tag).toMatch(/^<a /);
    expect(tag).toContain('href="/games"');
  });
});
