import { Icon, type IconName } from "@/components/Icon";
import { getStrings } from "@/lib/i18n/server";
import type { GameSurface } from "@/lib/types/database";

/**
 * The format and surface BADGES — top-right of a list card (ruling 6,
 * 2026-08-10).
 *
 * They returned from an inline `6v6 • Turf` text line, which buried two facts
 * a reader scans for in a sentence they have to read. Pre-v1.3 these were
 * chips, and the ruling restores that treatment: a pill with a SEMI-TRANSPARENT
 * FILL and a SOLID COLOURED OUTLINE, rather than the solid-volt chip the old
 * format badge used. The tint carries the colour without competing with the
 * spots figure, which remains the card's one accent (ruling D).
 *
 * TWO COLOURS, BECAUSE THEY ANSWER DIFFERENT QUESTIONS. Format is the kind of
 * football — the thing someone filters on — and takes the volt. Surface is
 * where it is played, a secondary fact, and takes bone. Giving both volt would
 * make the pair a block of colour with no hierarchy inside it.
 *
 * NEITHER IS INVENTED. A game whose organizer recorded no format shows no
 * format badge — v1.1.2 §5.3a rules against deriving one from capacity, and a
 * "6v6" printed from `capacity / 2` is a confident falsehood on a public page.
 *
 * The surface label is the TRANSLATED token (`games.surface.*`), never an
 * English string invented at the render site.
 *
 * GEOMETRY COMES FROM `.badge-pill` (round 8, item 6) — height, padding,
 * radius, type size and border width, written once in globals.css. This file
 * chooses INK and nothing else. The `size` prop is gone: the list and the
 * detail rendered the same badge at two sizes, and on the detail page it sat
 * beside a skill badge at a third.
 *
 * THE VOLT PILL DOES NOT, and deliberately. `.lifted` is the NEUTRAL surface
 * treatment; the format badge is the card's accent and its colour is the whole
 * of what it says. Folding it in would make the two badges identical and lose
 * the hierarchy the two-colour split above exists to draw. Same geometry, same
 * padding, same radius — different ink.
 */
/**
 * The shape both pills of the list card's cluster share: one height, one minimum width, one type size. Ink is per pill.
 * 82px holds "Indoor", "6v6v6" and the Thai "ชายหาด" with their icons, and keeps the cluster no wider than before,
 * so a venue name like "Swish Elite 50" still fits on one line beside it.
 */
const CARD_PILL =
  "inline-flex h-7 min-w-[82px] shrink-0 items-center justify-center gap-1 rounded-pill px-2 text-small font-bold";

const SURFACE_ICON: Record<GameSurface, IconName> = {
  indoor: "indoor",
  sand: "beach",
  turf: "turf",
  grass: "turf",
};

export async function CardBadges({
  format,
  surface,
  layout = "inline",
}: {
  format: string | null;
  surface: GameSurface | null;
  /**
   * PLAYCO: `card` is the list card's top-right pair, the format and the game type at one size. `inline` is the game
   * page's Format row.
   */
  layout?: "inline" | "card";
}) {
  const t = await getStrings();
  if (!format && !surface) return null;

  /*
   * THE LIST CARD'S PAIR (owner, 17 Nov 2026, after a HrajFotbal screenshot, then "make the beach pill the same as the
   * format pill in terms of size", then "remove the languages from the game card"):
   *
   *   [ 5v5 ]  [ Beach ]          the format leads and the game type sits on the far right, the two at ONE size.
   *
   * ONE ACCENT. Lime is the format alone; the game type wears dark glass, so the two equal pills still read in order.
   * They share one minimum width, so Indoor and Beach line up down a list. The languages are on the game page only.
   */
  if (layout === "card") {
    return (
      <div data-testid="card-badges" className="flex shrink-0 items-start gap-1.5">
        {format && (
          <span
            data-testid="game-format"
            className={`${CARD_PILL} bg-volt tabular-nums text-ink`}
          >
            <Icon name="users" className="h-3.5 w-3.5" />
            {format}
          </span>
        )}
        {surface && (
          <span
            data-testid="game-surface"
            className={`${CARD_PILL} border border-hairline-strong bg-page/60 text-bone`}
          >
            <Icon name={SURFACE_ICON[surface]} className="h-3.5 w-3.5" />
            {t.games.surface[surface]}
          </span>
        )}
      </div>
    );
  }

  const formatPill = format && (
    <span
      data-testid="game-format"
      className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-pill bg-cloud px-2.5 text-small font-semibold text-navy"
    >
      <Icon name="users" className="h-4 w-4" />
      {format}
    </span>
  );
  const surfaceTag = surface && (
    <span
      data-testid="game-surface"
      className="inline-flex h-[22px] shrink-0 items-center gap-1 rounded-pill border border-hairline-strong bg-page/40 px-2 text-[11px] font-medium text-bone"
    >
      <Icon name={SURFACE_ICON[surface]} className="h-3.5 w-3.5" />
      {t.games.surface[surface]}
    </span>
  );

  return (
    <div data-testid="card-badges" className="flex shrink-0 flex-wrap items-center gap-1">
      {formatPill}
      {surfaceTag}
    </div>
  );
}
