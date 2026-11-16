import { Icon } from "@/components/Icon";
import { FlagCZ, FlagGB, FlagRU, FlagTH, FlagUA } from "@/components/flags/Flags";
import type { GameLanguage } from "@/lib/games/language";

/**
 * "LANGUAGE ON THE COURT" (Playco rebrand). A pill: a globe, a thin divider, then one small round flag per language
 * the game is run in. It says which languages players speak at the game, which is a different thing from the
 * website's own language.
 *
 * Tokens only, so it reads on both contexts: on the photo card (a dark island) it is navy glass with a light ring;
 * in the admin form (the light page) it is a pale fill with a navy ring.
 */
const FLAGS = {
  "en-th": [FlagGB, FlagTH],
  en: [FlagGB],
  th: [FlagTH],
  "en-cs": [FlagGB, FlagCZ],
  "uk-ru": [FlagUA, FlagRU],
} as const;

const CIRCLE_PX = 18;

export function LanguagePill({ language }: { language: GameLanguage }) {
  return (
    <span
      data-testid="language-pill"
      data-language={language}
      className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-pill border border-hairline-strong bg-page/60 px-2"
    >
      <Icon name="globe" className="h-4 w-4 text-bone" />
      <span aria-hidden className="h-3.5 w-px bg-hairline-strong" />
      <span className="inline-flex items-center gap-1">
        {FLAGS[language].map((Flag, index) => (
          <span
            key={index}
            data-testid="language-pill-half"
            className="relative shrink-0 overflow-hidden rounded-full ring-1 ring-cloud/60"
            style={{ width: CIRCLE_PX, height: CIRCLE_PX }}
          >
            <Flag cover className="absolute inset-0 h-full w-full" />
          </span>
        ))}
      </span>
    </span>
  );
}
