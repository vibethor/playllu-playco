"use client";

import { useActionState, useState } from "react";
import {
  saveVenuePitchCostsAction,
  type PitchCostState,
} from "@/app/admin/venues/actions";
import { PendingButton } from "@/components/form/PendingButton";
import {
  pitchCostInForce,
  type PitchCostPair,
} from "@/lib/admin/venues/pitchCosts";
import { formatThb } from "@/lib/format";
import type { PitchSeason } from "@/lib/types/database";
import { strings } from "@/lib/strings";

const INITIAL: PitchCostState = { status: "idle" };

/** The form field each season posts as — what the action reads. */

/**
 * A venue's pitch cost, summer and winter (round 42, the admin rebuild) — the
 * owner's "area for 'pitch cost' ... two values, one for summer and another for
 * winter". Whole crowns, per game, flat.
 *
 * THE ONE NEW GAMES TAKE IS MARKED, from the page's read of the season switch,
 * with the same volt ring the switch uses for the season in force.
 *
 * CONTROLLED INPUTS, ON PURPOSE. React resets an uncontrolled form after its
 * action returns — even when the action returned a refusal — so a box named as
 * wrong would snap back to the old cost before anyone could fix it. These keep
 * what was typed until the admin changes it.
 *
 * THE CONFIRMATION STAYS until the next edit, and nothing closes: the venue's
 * row stays open around it.
 */
export function VenuePitchCostForm({
  venueId,
  costs,
  season,
}: {
  venueId: string;
  costs: PitchCostPair | null;
  season: PitchSeason;
}) {
  const [state, formAction] = useActionState(
    saveVenuePitchCostsAction,
    INITIAL,
  );
  /*
   * PLAYCO: ONE COURT COST (owner, 17 Nov 2026: "only one season in Thailand"). The field starts from the price new
   * games take today (the season in force) and is posted as BOTH season values, so the server rule is untouched and
   * whichever season the (now hidden) switch holds prices games the same.
   */
  const [value, setValue] = useState<string>(
    costs ? String(pitchCostInForce(costs, season)) : "",
  );
  const [editedSinceSave, setEditedSinceSave] = useState(false);
  const copy = strings.admin.pitch;

  const saved =
    state.status === "saved" &&
    !editedSinceSave &&
    state.summerThb !== undefined &&
    state.winterThb !== undefined
      ? { summerThb: state.summerThb, winterThb: state.winterThb }
      : null;
  const invalid =
    state.status === "error" && !editedSinceSave ? (state.invalid ?? []) : [];

  return (
    <form
      action={formAction}
      onSubmit={() => setEditedSinceSave(false)}
      data-testid="venue-pitch-cost-form"
    >
      <input type="hidden" name="venueId" value={venueId} />
      <p className="m-0 text-[12px] leading-relaxed text-muted">
        {copy.costLedeOne}
      </p>

      <input type="hidden" name="summerThb" value={value} />
      <input type="hidden" name="winterThb" value={value} />
      <div className="mt-3 max-w-[240px]">
        <label htmlFor={`pitch-cost-${venueId}`} className="field-label">
          {copy.costLabel}
        </label>
        <div className="relative mt-2">
          <input
            id={`pitch-cost-${venueId}`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setEditedSinceSave(true);
            }}
            aria-invalid={invalid.length > 0 || undefined}
            aria-describedby={
              invalid.length > 0 ? `pitch-cost-error-${venueId}` : undefined
            }
            data-testid="venue-pitch-cost-input"
            className={`field w-full py-2 pl-3 pr-12 tabular-nums ${invalid.length > 0 ? "border-danger" : ""}`}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted"
          >
            {copy.currency}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <PendingButton label={copy.costSave} testId="venue-pitch-cost-save" />
        {saved && (
          <p
            role="status"
            data-testid="venue-pitch-cost-saved"
            className="m-0 text-small text-accent"
          >
            {copy.costSaved.replace(
              "{amount}",
              formatThb(pitchCostInForce(saved, season)),
            )}
          </p>
        )}
      </div>

      {state.status === "error" && state.message && !editedSinceSave && (
        <p
          role="alert"
          id={`pitch-cost-error-${venueId}`}
          data-testid="venue-pitch-cost-error"
          className="mb-0 mt-3 text-small text-bone"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
