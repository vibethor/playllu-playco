-- =============================================================================
-- Playllu HQ reads Playco: the read-only role `hq_readonly` (plan Phase 13; Jachym, 17 Nov 2026).
--
-- HQ (playllu/playllu-hq) shows every city's games, players and money. It reads Playco the way it reads HrajFotbal
-- (HQ's supabase/roles/hq_roles.sql): a login role whose sessions are read-only, with SELECT on NAMED COLUMNS ONLY.
--
--   * never email, phone, auth ids, Stripe ids, payment codes or anything a player typed for staff;
--   * no write of any kind: read-only transactions, and no INSERT / UPDATE / DELETE / EXECUTE grant;
--   * BYPASSRLS, because Playco's RLS policies answer "whose row is this?" for a signed-in player, and HQ is not one;
--     what it may see is limited by the column grants below instead.
--
-- The contract (what each column means, what may never change without an HQ pull request) is docs/HQ_CONTRACT.md.
-- Tested by supabase/tests/hq_readonly_role.sql.
--
-- RUN BY JACHYM in the Supabase SQL editor of project `playco`, then he sets the password there himself:
--     alter role hq_readonly password '<letters and digits, 32+ characters>';
-- The password never goes into this file, a chat or a commit. HQ refuses a connection string with an unencoded
-- `/ ? # @` in it, hence letters and digits.
--
-- Idempotent: safe to run again after a column is added to the contract.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'hq_readonly') then
    create role hq_readonly login bypassrls nocreatedb nocreaterole noinherit connection limit 10;
  end if;
end $$;

alter role hq_readonly set default_transaction_read_only = on;
alter role hq_readonly set statement_timeout = '15s';
alter role hq_readonly set search_path = public;

-- Start from nothing, so a column removed from the contract is also removed here when this file is run again.
revoke all on all tables in schema public from hq_readonly;
revoke all on all functions in schema public from hq_readonly;
revoke all on all sequences in schema public from hq_readonly;
grant usage on schema public to hq_readonly;

grant select (id, nickname, country, skill_level, marketing_opt_in, created_at, is_admin, is_seed, deleted_at, banned_at,
              photo_path, is_organizer, referred_by, referred_at)
  on public.players to hq_readonly;

grant select (id, game_number, city, brand, language, venue, venue_id, starts_at, duration_minutes, capacity, price_thb,
              status, format, surface, guest_count, created_at)
  on public.games to hq_readonly;

grant select (id, game_id, player_id, status, payment_method, price_thb, credit_applied_thb, guest_count, is_seed,
              booked_by_admin, attendance, created_at)
  on public.bookings to hq_readonly;

grant select (id, player_id, delta_thb, reason, booking_id, created_at, expires_at, batch_id)
  on public.credit_ledger to hq_readonly;

grant select (id, player_id, amount_thb, received_amount_thb, status, pass_games, city, created_at, confirmed_at)
  on public.credit_topups to hq_readonly;

grant select (id, player_id, game_id, guest_count, amount_thb, status, booking_id, kind, created_at, settled_at)
  on public.checkout_sessions to hq_readonly;

grant select (id, event_type, player_id, game_id, booking_id, metadata, city, brand, created_at)
  on public.events to hq_readonly;

grant select (game_id, cost_thb, set_by_hand, updated_at) on public.game_pitch_costs to hq_readonly;

grant select (id, name, city, archived_at) on public.venues to hq_readonly;

grant select (venue_id, summer_thb, winter_thb, updated_at) on public.venue_pitch_costs to hq_readonly;

grant select (games, price_thb, credited_thb, expires_months) on public.pass_tiers to hq_readonly;
