/**
 * The games an admin can add a player to, free (owner, 17 Nov 2026: "add them to an upcoming game").
 *
 * Published or full, not started, soonest first. A game the player already holds a spot in, or a full one, stays in
 * the list but cannot be picked (`disabledReason`), so the admin sees why it is not available instead of wondering
 * where it went. `admin_add_free_seat` enforces the same rules; this only shapes the dropdown.
 */
export interface AddToGameSource {
  id: string;
  venue: string;
  starts_at: string;
  status: string;
  capacity: number;
  activeCount: number;
}

export type AddToGameDisabledReason = "alreadyIn" | "full";

export interface AddToGameOption {
  id: string;
  venue: string;
  startsAt: string;
  spotsLeft: number;
  disabledReason: AddToGameDisabledReason | null;
}

const BOOKABLE_STATUSES = new Set(["published", "full"]);

export function addToGameOptions(
  games: readonly AddToGameSource[],
  playerGameIds: readonly string[],
  now: Date,
): AddToGameOption[] {
  const holding = new Set(playerGameIds);
  return games
    .filter(
      (game) =>
        BOOKABLE_STATUSES.has(game.status) &&
        Date.parse(game.starts_at) > now.getTime(),
    )
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
    .map((game) => {
      const spotsLeft = Math.max(0, game.capacity - game.activeCount);
      const disabledReason: AddToGameDisabledReason | null = holding.has(
        game.id,
      )
        ? "alreadyIn"
        : spotsLeft === 0
          ? "full"
          : null;
      return {
        id: game.id,
        venue: game.venue,
        startsAt: game.starts_at,
        spotsLeft,
        disabledReason,
      };
    });
}
