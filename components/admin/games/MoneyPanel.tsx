import { BreakEvenLine } from "@/components/admin/games/BreakEvenLine";
import { PitchCostForm } from "@/components/admin/games/PitchCostForm";
import { BreakdownBars, type BreakdownRow } from "@/components/admin/ui/BreakdownBars";
import { SignedThb } from "@/components/admin/ui/Money";
import { Panel } from "@/components/admin/ui/Panel";
import type { GameEconomics, GamePitchCost } from "@/lib/admin/economics";
import { breakEvenOutlook } from "@/lib/admin/games/breakEven";
import { formatSeats } from "@/lib/admin/seatBar";
import { formatThb } from "@/lib/format";
import { strings } from "@/lib/strings";

const hub = strings.admin.gamesHub;

function seatsLabel(seats: number): string {
  return seats === 1 ? hub.seatsOne : hub.seatsMany.replace("{n}", formatSeats(seats));
}

/**
 * What this game made (round 42, the admin rebuild): revenue split by how each
 * seat was paid — a single game at its price, a Game Pass Credit at the pass
 * price over its games, a balance Credit at what was paid for it, money kept
 * from a late cancellation — then what is still owed, the pitch, and the line
 * that matters: profit. Every number is `game_economics`'s; nothing here does
 * arithmetic beyond laying it out.
 *
 * Rendered only once `app_capabilities()` says `pitchCosts`.
 */
export function MoneyPanel({
  gameId,
  economics,
  pitch,
  upcoming,
}: {
  gameId: string;
  economics: GameEconomics;
  /** The game's pitch cost and whether an admin set it; null for a game with none. */
  pitch: GamePitchCost | null;
  /** An upcoming game still has seats to sell, so it says how many it needs. */
  upcoming: boolean;
}) {
  const split: BreakdownRow[] = (
    [
      ["single", economics.singleSeats, economics.singleThb],
      ["pass", economics.passSeats, economics.passThb],
      ["credit", economics.creditSeats, economics.creditThb],
    ] as const
  )
    .filter(([, , thb]) => thb > 0)
    .map(([kind, seats, thb]) => ({
      key: kind,
      label: `${strings.admin.seatKinds[kind]} · ${seatsLabel(seats)}`,
      value: thb,
      display: formatThb(thb),
    }));
  if (economics.keptThb > 0) {
    split.push({ key: "kept", label: hub.kept, value: economics.keptThb, display: formatThb(economics.keptThb) });
  }

  return (
    <Panel
      title={hub.moneyTitle}
      testId="game-money"
      action={
        economics.profitThb !== null && (
          <SignedThb amount={economics.profitThb} className="text-body font-bold" testId="game-money-profit" />
        )
      }
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-small text-muted">{hub.revenue}</span>
        <span data-testid="game-revenue" className="font-display text-[28px] leading-none tabular-nums text-white">
          {formatThb(economics.revenueThb)}
        </span>
      </div>
      <div className="mt-3">
        <BreakdownBars rows={split} testId="game-revenue-split" emptyText={hub.revenueNone} />
      </div>

      <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-2 border-t border-hairline pt-4 text-small">
        {economics.owedThb > 0 && (
          <>
            <dt className="min-w-0 text-muted">
              {hub.owed}
              <span className="block text-[11px] text-faint">{hub.owedHint}</span>
            </dt>
            <dd data-testid="game-owed" className="m-0 text-right tabular-nums text-warn">
              {formatThb(economics.owedThb)}
            </dd>
          </>
        )}

        <dt className="min-w-0 text-muted">
          {hub.pitchCost}
          {pitch && (
            <span
              data-testid="pitch-cost-source"
              data-set-by-hand={pitch.setByHand ? "true" : "false"}
              className={`ml-2 rounded-pill border px-2 py-[1px] text-[10px] uppercase tracking-eyebrow ${
                pitch.setByHand ? "border-hairline-volt text-volt" : "border-hairline text-faint"
              }`}
            >
              {pitch.setByHand ? hub.pitchCostByHand : hub.pitchCostFromVenue}
            </span>
          )}
        </dt>
        <dd data-testid="game-pitch-cost" className="m-0 text-right tabular-nums text-bone">
          {economics.pitchCostThb === null ? hub.noPitchCost : `− ${formatThb(economics.pitchCostThb)}`}
        </dd>

        {economics.profitThb !== null && (
          <>
            <dt className="border-t border-hairline pt-2 font-semibold text-white">{hub.profit}</dt>
            <dd className="m-0 border-t border-hairline pt-2 text-right text-body font-bold">
              <SignedThb amount={economics.profitThb} testId="game-profit" />
            </dd>
          </>
        )}

        {economics.breakEvenSeats !== null && (
          <>
            <dt className="text-muted">{strings.admin.breakEven}</dt>
            <dd className="m-0 text-right text-bone">
              <span className="tabular-nums">
                {strings.admin.breakEvenAt.replace("{n}", String(economics.breakEvenSeats))}
              </span>
              {upcoming && (
                <span className="block text-[12px]">
                  <BreakEvenLine outlook={breakEvenOutlook(economics)} testId="game-break-even" />
                </span>
              )}
            </dd>
          </>
        )}
      </dl>

      {economics.pitchCostThb === null && !pitch && (
        <p className="mt-3 text-[12px] text-muted">{hub.pitchCostNone}</p>
      )}
      <PitchCostForm gameId={gameId} costThb={pitch?.costThb ?? null} setByHand={pitch?.setByHand ?? false} />
    </Panel>
  );
}
