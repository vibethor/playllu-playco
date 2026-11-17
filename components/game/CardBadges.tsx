import { Icon, type IconName } from "@/components/Icon";
import { LanguagePill } from "@/components/game/LanguagePill";
import type { GameLanguage } from "@/lib/games/language";
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
const SURFACE_ICON: Record<GameSurface, IconName> = {
  indoor: "indoor",
  sand: "beach",
  turf: "turf",
  grass: "turf",
};

export async function CardBadges({
  format,
  surface,
  language,
  layout = "inline",
}: {
  format: string | null;
  surface: GameSurface | null;
  language?: GameLanguage;
  /**
   * PLAYCO: `card` is the list card's right-hand cluster from the reference design — the format pill and the
   * language pill on one row, the surface tag under them. `inline` is everything else (the game page's facts).
   */
  layout?: "inline" | "card";
}) {
  const t = await getStrings();
  if (!format && !surface && !language) return null;

  /*
   * THE LIST CARD'S CLUSTER (owner, 17 Nov 2026, after a HrajFotbal screenshot):
   *
   *   [ 5v5 ]  [ Beach ]          the format leads: lime, the height of the languages pill, the one bright thing
   *            [ 🌐 | 🇬🇧 ]        up here; the game type is the small quiet pill on the far right, and the
   *                               languages sit CENTRED under it, not right-aligned.
   *
   * ONE ACCENT. The game type was a white pill and the format a navy one with a lime icon: three treatments in one
   * corner ("too many colours … a little bit too hectic"). Now lime is the format alone, and the game type wears the
   * same dark glass as the languages pill. Indoor and Beach keep one fixed width so cards line up down a list.
   */
  if (layout === "card") {
    if (!surface && !language && !format) return null;
    return (
      <div data-testid="card-badges" className="flex shrink-0 items-start gap-1.5">
        {format && (
          <span
            data-testid="game-format"
            className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-pill bg-volt px-2.5 text-small font-bold tabular-nums text-ink"
          >
            <Icon name="users" className="h-4 w-4" />
            {format}
          </span>
        )}
        {(surface || language) && (
          <div data-testid="card-badges-type" className="flex flex-col items-center gap-1.5">
            {surface && (
              <span
                data-testid="game-surface"
                /* `mt-0.5` puts its middle on the format pill's middle (28px beside 24px). */
                className="mt-0.5 inline-flex h-6 w-[84px] shrink-0 items-center justify-center gap-1 rounded-pill border border-hairline-strong bg-page/60 text-[12px] font-semibold text-bone"
              >
                <Icon name={SURFACE_ICON[surface]} className="h-3.5 w-3.5" />
                {t.games.surface[surface]}
              </span>
            )}
            {language && <LanguagePill language={language} />}
          </div>
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
      {language ? <LanguagePill language={language} /> : surfaceTag}
    </div>
  );
}
