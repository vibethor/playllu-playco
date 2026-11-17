import { Icon } from "@/components/Icon";
import {
  FlagCZ,
  FlagGB,
  FlagRU,
  FlagTH,
  FlagUA,
} from "@/components/flags/Flags";
import { ROUND_FLAG_PX, RoundFlag } from "@/components/flags/RoundFlag";
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

/**
 * TWO SIZES. `card` is the game card's: about a third smaller than the default (owner, 17 Nov 2026: the languages
 * are "not so important … like 30 to 40% smaller, so it's still clear and you can read it") — 18px tall against 28,
 * flags 12px against 18. The game page and the admin form keep the default.
 */
const SIZES = {
  default: { pill: "h-7 gap-1.5 px-2", globe: "h-4 w-4", divider: "h-3.5", flags: "gap-1", flagPx: ROUND_FLAG_PX },
  card: { pill: "h-[18px] gap-1 px-1.5", globe: "h-3 w-3", divider: "h-2.5", flags: "gap-0.5", flagPx: 12 },
} as const;

export function LanguagePill({ language, size = "default" }: { language: GameLanguage; size?: keyof typeof SIZES }) {
  const look = SIZES[size];
  return (
    <span
      data-testid="language-pill"
      data-language={language}
      className={`inline-flex shrink-0 items-center rounded-pill border border-hairline-strong bg-page/60 ${look.pill}`}
    >
      <Icon name="globe" className={`${look.globe} text-bone`} />
      <span aria-hidden className={`${look.divider} w-px bg-hairline-strong`} />
      <span className={`inline-flex items-center ${look.flags}`}>
        {FLAGS[language].map((Flag, index) => (
          <RoundFlag key={index} Flag={Flag} size={look.flagPx} testId="language-pill-half" />
        ))}
      </span>
    </span>
  );
}
