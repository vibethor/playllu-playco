import { notFound } from "next/navigation";
import { AdminRightsButton } from "@/components/admin/AdminRightsButton";
import { BanPlayerButton } from "@/components/admin/BanPlayerButton";
import { ChangeNameForm } from "@/components/admin/ChangeNameForm";
import { DeletePlayerButton } from "@/components/admin/DeletePlayerButton";
import { GrantCreditForm } from "@/components/admin/GrantCreditForm";
import { OrganizerRightsButton } from "@/components/admin/OrganizerRightsButton";
import { PlayerGameRow } from "@/components/admin/PlayerGameRow";
import { RemoveCoverButton } from "@/components/admin/RemoveCoverButton";
import { RemoveCreditForm } from "@/components/admin/RemoveCreditForm";
import { RemovePhotoButton } from "@/components/admin/RemovePhotoButton";
import { AddToGameForm } from "@/components/admin/players/AddToGameForm";
import { KpiTile } from "@/components/admin/players/KpiTile";
import { MoneySpentPanel } from "@/components/admin/players/MoneySpentPanel";
import { PlayerHeader } from "@/components/admin/players/PlayerHeader";
import { SectionHeading } from "@/components/admin/players/SectionHeading";
import { Panel } from "@/components/admin/ui/Panel";
import { adminWallet } from "@/lib/admin/credits";
import { getBookingSeatValues } from "@/lib/admin/economics";
import { historyFigures } from "@/lib/admin/players/activity";
import { CAME_BACK_GAMES } from "@/lib/admin/players/segments";
import { playerSpend } from "@/lib/admin/players/spend";
import { addToGameOptions } from "@/lib/admin/players/addToGame";
import { getAdminPlayer, listAllGames } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { appCapabilities } from "@/lib/db/capabilities";
import { formatThb, formatDate, formatGameDateTime } from "@/lib/format";
import { avatarUrl } from "@/lib/storage/avatar";
import { profilePhotoVersion } from "@/lib/storage/photoVersions";
import { strings } from "@/lib/strings";

export const metadata = {
  title: strings.admin.playerDetailTitle,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const t = strings.admin.playersHub;

/** Under the last game: whether they came back, in words. */
function cameBackLine(gamesPlayed: number): string {
  if (gamesPlayed >= CAME_BACK_GAMES)
    return t.playerKpis.cameBack.replace("{n}", String(gamesPlayed));
  if (gamesPlayed === 1) return t.playerKpis.oneGame;
  return t.playerKpis.notPlayed;
}

/**
 * One player, everything the organizer needs about them (REQ-ADMIN-001;
 * rebuilt round 42).
 *
 * WHO, THEN THE NUMBERS, THEN WHAT YOU CAN DO, THEN WHAT HAPPENED. The header
 * says who this is and how to reach them; four figures say how they play and
 * what they hold (and, once the pitch-cost migration is live, what they have
 * paid); the controls sit in three panels by what they change — rights, the
 * account, the Credit — and the history closes the page, one row per game.
 *
 * EVERY CONTROL IS THE ONE THAT WAS HERE, with its own confirm step, its own
 * capability gate and its own RPC — `set_player_admin`, `admin_set_organizer`,
 * `grant_credit` and the rest re-check authorization inside the function, so
 * these panels are controls over a boundary that was already there. The
 * panels only regroup them.
 *
 * EVERYTHING SHOWN HERE IS PII an admin is entitled to see and nobody else is.
 * The page is under `app/admin/layout.tsx`, which runs `requireAdmin()` first,
 * and every read goes through the service-role client.
 */
export default async function AdminPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const acting = await requireAdmin();
  const { id } = await params;
  const detail = await getAdminPlayer(id);
  if (!detail) notFound();

  // Every control below an RPC is gated: a control whose function does not
  // exist is a button that 404s, which round 12 ruled against.
  const capabilities = await appCapabilities();

  const { player, balanceThb, games } = detail;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const [photoVersion, coverVersion] = await Promise.all([
    profilePhotoVersion(player.photo_path),
    profilePhotoVersion(player.cover_path ?? null),
  ]);
  // Round 41: the bytes' own version — `created_at` never moved.
  const photo = avatarUrl(supabaseUrl, player.photo_path, photoVersion);
  const cover = avatarUrl(supabaseUrl, player.cover_path ?? null, coverVersion);

  const figures = historyFigures(games);
  const wallet = adminWallet(balanceThb);
  const spend = capabilities.pitchCosts
    ? playerSpend(
        await getBookingSeatValues([
          ...new Set(games.map((row) => row.gameId)),
        ]),
        player.id,
      )
    : null;

  const isDeleted = Boolean(player.deleted_at);

  /*
   * PLAYCO (owner, 17 Nov 2026): the games this player can be added to, free. A game they hold an active spot in
   * is shown as "already in"; a full one as "full". admin_add_free_seat enforces the same rules.
   */
  const activeGameIds = games
    .filter((row) => row.status === "reserved" || row.status === "confirmed")
    .map((row) => row.gameId);
  const addChoices = isDeleted
    ? []
    : addToGameOptions(await listAllGames(), activeGameIds, new Date()).map(
        (option) => {
          const template: string =
            option.disabledReason === "alreadyIn"
              ? t.addToGameAlreadyIn
              : option.disabledReason === "full"
                ? t.addToGameFull
                : t.addToGameOption;
          const label = template
            .replace("{when}", formatGameDateTime(option.startsAt))
            .replace("{venue}", option.venue)
            .replace("{spots}", String(option.spotsLeft));
          return {
            id: option.id,
            label,
            disabled: option.disabledReason !== null,
          };
        },
      );
  const canBan = capabilities.banProfile && !isDeleted;
  const canDelete =
    capabilities.deleteAccount && !isDeleted && !player.is_admin;

  return (
    <>
      <PlayerHeader player={player} photoUrl={photo} coverUrl={cover} />

      {/* --- the figures ------------------------------------------------------ */}
      <section
        data-testid="admin-player-stats"
        className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3"
      >
        <KpiTile
          label={t.playerKpis.gamesPlayed}
          value={String(figures.gamesPlayed)}
          valueTestId="admin-player-games-played"
        >
          <span>
            {strings.admin.bookingsLabel} {games.length}
          </span>
        </KpiTile>
        <KpiTile
          label={t.playerKpis.lastGame}
          value={
            figures.lastGameAt ? formatDate(figures.lastGameAt) : t.noGameYet
          }
          valueTestId="admin-player-last-game"
          size="md"
          tone="white"
        >
          <span
            data-testid="admin-player-came-back"
            className={
              figures.gamesPlayed >= CAME_BACK_GAMES ? "text-accent" : undefined
            }
          >
            {cameBackLine(figures.gamesPlayed)}
          </span>
        </KpiTile>
        {/* ~~No-shows~~ — attendance is gone (2026-11-09). */}
        {/*
          THE WALLET READS IN CREDITS, EXACTLY AS THE PLAYER SEES IT (round 31,
          item 3), and the ragged case is handled rather than rounded: the count
          is a FLOOR, so a balance that does not divide into whole Credits shows
          its exact crowns beneath.
        */}
        <KpiTile
          label={t.playerKpis.credit}
          value={String(wallet.credits)}
          valueTestId="admin-player-balance"
        >
          {wallet.remainderThb !== null && (
            <span
              data-testid="admin-player-balance-exact"
              className="text-faint"
            >
              {strings.admin.walletExactThb.replace(
                "{thb}",
                formatThb(wallet.remainderThb),
              )}
            </span>
          )}
        </KpiTile>
      </section>

      {spend && (
        <div className="mt-3">
          <MoneySpentPanel spend={spend} />
        </div>
      )}

      {/*
        ONE "ACTIONS" PANEL (owner, 18 Nov 2026): Rights, Account and Credit used to be three panels with a paragraph
        each. The buttons and what they do are unchanged; they are grouped into tiles in one panel, without the text.
        History and "Add to a game" follow at the bottom.
      */}
      <Panel testId="admin-actions" className="mt-6">
        <SectionHeading title={t.actionsTitle} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ActionGroup title={t.rightsTitle} testId="admin-player-rights">
            <AdminRightsButton playerId={player.id} isAdmin={player.is_admin} />
            {capabilities.organizerPlayer && !isDeleted && (
              <OrganizerRightsButton
                playerId={player.id}
                isOrganizer={Boolean(player.is_organizer)}
              />
            )}
            {player.id === acting.id && (
              <p
                data-testid="admin-rights-self-note"
                className="m-0 w-full text-[11px] text-faint"
              >
                {strings.admin.adminSelfNote}
              </p>
            )}
          </ActionGroup>

          <ActionGroup title={t.accountProfile} testId="admin-player-account">
            {capabilities.adminRenamePlayer && (
              <ChangeNameForm playerId={player.id} name={player.nickname} />
            )}
            {player.photo_path && <RemovePhotoButton playerId={player.id} />}
            {player.cover_path && <RemoveCoverButton playerId={player.id} />}
          </ActionGroup>

          <ActionGroup title={t.creditTitle} testId="admin-player-credit" wide>
            <GrantCreditForm playerId={player.id} />
            <RemoveCreditForm playerId={player.id} balanceThb={balanceThb} />
          </ActionGroup>

          {(canBan || canDelete || player.banned_at) && (
            <ActionGroup title={t.accountAccess} testId="admin-player-access" danger>
              {canBan && (
                <BanPlayerButton
                  playerId={player.id}
                  isBanned={Boolean(player.banned_at)}
                />
              )}
              {canDelete && <DeletePlayerButton playerId={player.id} />}
              {player.banned_at && (
                <p
                  data-testid={
                    isDeleted ? "player-deleted-notice" : "player-banned-notice"
                  }
                  className="m-0 w-full text-[11px] uppercase tracking-eyebrow text-danger"
                >
                  {isDeleted ? strings.admin.deleted : strings.admin.banned}
                </p>
              )}
            </ActionGroup>
          )}
        </div>
      </Panel>

      {/* --- history ------------------------------------------------------------ */}
      <Panel testId="admin-player-history" className="mt-4">
        <SectionHeading title={strings.admin.playerGamesTitle} />
        {games.length === 0 ? (
          <p className="m-0 text-small text-faint">
            {strings.admin.playerGamesEmpty}
          </p>
        ) : (
          <ul className="m-0 list-none p-0">
            {games.map((row) => (
              <PlayerGameRow key={row.bookingId} row={row} />
            ))}
          </ul>
        )}
      </Panel>

      {/* --- add to a game, last ------------------------------------------------- */}
      {!isDeleted && (
        <Panel testId="admin-player-add-to-game" className="mt-4">
          <SectionHeading title={t.addToGameTitle} />
          <AddToGameForm playerId={player.id} choices={addChoices} />
        </Panel>
      )}
    </>
  );
}

/** One tile of the Actions panel: a small label and its buttons. */
function ActionGroup({
  title,
  testId,
  wide = false,
  danger = false,
  children,
}: {
  title: string;
  testId: string;
  wide?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      data-testid={testId}
      className={`flex min-w-0 flex-col gap-3 rounded-control border bg-surface p-4 ${
        danger ? "border-danger/40" : "border-hairline"
      } ${wide ? "sm:col-span-2 xl:col-span-2" : ""}`}
    >
      <h4
        className={`m-0 text-[10px] font-normal uppercase tracking-eyebrow ${
          danger ? "text-danger" : "text-faint"
        }`}
      >
        {title}
      </h4>
      <div className="flex flex-wrap items-start gap-2">{children}</div>
    </div>
  );
}
