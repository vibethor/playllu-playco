"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  addToGameAction,
  type PlayerAdminState,
} from "@/app/admin/players/[id]/actions";
import { chipPrimary } from "@/components/admin/players/controlStyles";
import { strings } from "@/lib/strings";

const INITIAL: PlayerAdminState = { status: "idle" };

export interface AddToGameChoice {
  id: string;
  label: string;
  disabled: boolean;
}

/**
 * PLAYCO (owner, 17 Nov 2026): add this player to an upcoming game, free. The choices come from
 * `addToGameOptions` (published, not started, soonest first); a game they are already in, or a full one, is shown
 * but cannot be picked.
 */
export function AddToGameForm({
  playerId,
  choices,
}: {
  playerId: string;
  choices: AddToGameChoice[];
}) {
  const [state, formAction] = useActionState(addToGameAction, INITIAL);
  const firstOpen = choices.find((choice) => !choice.disabled);

  /*
   * Only a list with no upcoming games at all swaps the form for a line of text. When every game is "already in" or
   * full (for example right after adding them to the only one), the form stays, so the confirmation stays on screen.
   */
  if (choices.length === 0) {
    return (
      <p data-testid="add-to-game-empty" className="m-0 text-[12px] text-faint">
        {strings.admin.playersHub.addToGameEmpty}
      </p>
    );
  }

  return (
    <form action={formAction} data-testid="add-to-game-form">
      <input type="hidden" name="playerId" value={playerId} />
      <label className="block" htmlFor={`add-to-game-${playerId}`}>
        <span className="field-label block">
          {strings.admin.playersHub.addToGameLabel}
        </span>
        <select
          id={`add-to-game-${playerId}`}
          name="gameId"
          defaultValue={firstOpen?.id ?? choices[0]!.id}
          data-testid="add-to-game-select"
          className="field mt-2 w-full"
        >
          {choices.map((choice) => (
            <option
              key={choice.id}
              value={choice.id}
              disabled={choice.disabled}
            >
              {choice.label}
            </option>
          ))}
        </select>
      </label>
      {!firstOpen && state.status !== "done" && (
        <p
          data-testid="add-to-game-none-open"
          className="mt-2 text-[12px] text-faint"
        >
          {strings.admin.playersHub.addToGameNoneOpen}
        </p>
      )}
      <div className="mt-3">
        <Submit disabled={!firstOpen} />
      </div>
      {state.status === "done" && (
        <p
          role="status"
          data-testid="add-to-game-done"
          className="mt-2 text-[12px] text-accent"
        >
          {strings.admin.playersHub.addToGameDone}
        </p>
      )}
      {state.status === "error" && state.message && (
        <p
          role="alert"
          data-testid="add-to-game-error"
          className="mt-2 text-[12px] text-danger"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      data-testid="add-to-game-submit"
      className={chipPrimary}
    >
      {strings.admin.playersHub.addToGameSubmit}
    </button>
  );
}
