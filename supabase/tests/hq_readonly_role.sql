-- =============================================================================
-- HQ's read-only role on Playco (plan Phase 13; Jachym, 17 Nov 2026)
--
-- Run:  psql -f supabase/roles/hq_readonly.sql   (once, after the migrations — the role is not a migration)
--       node supabase/tests/run.mjs hq_readonly_role
--
-- docs/HQ_CONTRACT.md: HQ may read the named columns and nothing else. It can never read an email, a phone number, an
-- auth id, a Stripe id or a payment code, and it can never write.
-- =============================================================================

begin;

create temp table _results (
  seq serial primary key, label text, passed boolean, detail text
) on commit drop;

create function pg_temp.ok(cond boolean, label text, detail text default '')
returns void language plpgsql security definer as $$
begin
  insert into _results (label, passed, detail) values (label, coalesce(cond, false), detail);
end $$;

-- Runs `stmt` as hq_readonly and reports whether Postgres refused it.
create function pg_temp.refused(stmt text)
returns boolean language plpgsql as $$
begin
  execute 'set local role hq_readonly';
  begin
    execute stmt;
  exception when insufficient_privilege or read_only_sql_transaction then
    execute 'reset role';
    return true;
  end;
  execute 'reset role';
  return false;
end $$;

-- =============================================================================
-- THE ROLE
-- =============================================================================

select pg_temp.ok(
  exists (select 1 from pg_roles where rolname = 'hq_readonly' and rolcanlogin and rolbypassrls and not rolsuper
                                     and not rolcreaterole and not rolcreatedb),
  'hq_readonly exists, can log in, bypasses RLS, and is not a superuser or role creator');

select pg_temp.ok(
  (select rolconfig @> array['default_transaction_read_only=on'] from pg_roles where rolname = 'hq_readonly'),
  'hq_readonly sessions are read-only by default');

-- =============================================================================
-- WHAT IT MAY NEVER READ
-- =============================================================================

select pg_temp.ok(not has_column_privilege('hq_readonly', 'public.players', 'email', 'SELECT'),
  'cannot read players.email');
select pg_temp.ok(not has_column_privilege('hq_readonly', 'public.players', 'phone', 'SELECT'),
  'cannot read players.phone');
select pg_temp.ok(not has_column_privilege('hq_readonly', 'public.players', 'auth_user_id', 'SELECT'),
  'cannot read players.auth_user_id');
select pg_temp.ok(not has_column_privilege('hq_readonly', 'public.bookings', 'stripe_session_id', 'SELECT'),
  'cannot read bookings.stripe_session_id');
select pg_temp.ok(not has_column_privilege('hq_readonly', 'public.bookings', 'payment_code', 'SELECT'),
  'cannot read bookings.payment_code');
select pg_temp.ok(not has_column_privilege('hq_readonly', 'public.checkout_sessions', 'stripe_session_id', 'SELECT'),
  'cannot read checkout_sessions.stripe_session_id');
select pg_temp.ok(not has_column_privilege('hq_readonly', 'public.credit_topups', 'payment_code', 'SELECT'),
  'cannot read credit_topups.payment_code');

select pg_temp.ok(
  not exists (
    select 1 from information_schema.column_privileges
     where grantee = 'hq_readonly' and table_schema = 'public'
       and table_name in ('banned_phones', 'consent_records', 'game_organizer_contacts', 'notifications',
                          'user_notification_reads', 'waitlist', 'site_settings')),
  'reads nothing from the tables outside the contract (contacts, consent, bans, notifications, waitlist, settings)');

select pg_temp.ok(pg_temp.refused('select email from public.players limit 1'),
  'selecting an email as hq_readonly is refused');
select pg_temp.ok(pg_temp.refused('select * from public.players limit 1'),
  'select * on players as hq_readonly is refused (some columns are not granted)');

-- =============================================================================
-- WHAT IT MAY NEVER DO
-- =============================================================================

select pg_temp.ok(
  not exists (
    select 1 from information_schema.table_privileges
     where grantee = 'hq_readonly' and table_schema = 'public'
       and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')),
  'holds no write privilege on any table');

select pg_temp.ok(
  not exists (
    select 1 from information_schema.column_privileges
     where grantee = 'hq_readonly' and table_schema = 'public' and privilege_type <> 'SELECT'),
  'holds no column privilege other than SELECT');

select pg_temp.ok(
  not exists (
    select 1 from information_schema.routine_privileges
     where grantee = 'hq_readonly' and routine_schema = 'public'),
  'may execute no function directly granted to it');

select pg_temp.ok(pg_temp.refused($$update public.games set capacity = capacity where false$$),
  'an update as hq_readonly is refused');

-- =============================================================================
-- WHAT IT READS (docs/HQ_CONTRACT.md)
-- =============================================================================

select pg_temp.ok(
  (select bool_and(has_column_privilege('hq_readonly', 'public.' || t, c, 'SELECT'))
     from (values
       ('players', 'nickname'), ('players', 'country'), ('players', 'skill_level'), ('players', 'is_admin'),
       ('players', 'deleted_at'), ('players', 'referred_by'),
       ('games', 'starts_at'), ('games', 'duration_minutes'), ('games', 'capacity'), ('games', 'price_thb'),
       ('games', 'status'), ('games', 'venue_id'), ('games', 'city'),
       ('bookings', 'status'), ('bookings', 'payment_method'), ('bookings', 'price_thb'),
       ('bookings', 'credit_applied_thb'), ('bookings', 'guest_count'), ('bookings', 'is_seed'),
       ('credit_ledger', 'delta_thb'), ('credit_ledger', 'reason'), ('credit_ledger', 'expires_at'),
       ('credit_topups', 'amount_thb'), ('credit_topups', 'received_amount_thb'), ('credit_topups', 'pass_games'),
       ('checkout_sessions', 'status'), ('checkout_sessions', 'amount_thb'), ('checkout_sessions', 'kind'),
       ('events', 'event_type'), ('events', 'metadata'),
       ('game_pitch_costs', 'cost_thb'), ('venues', 'name'), ('venue_pitch_costs', 'summer_thb'),
       ('pass_tiers', 'price_thb')
     ) as want(t, c)),
  'can read every column the contract names');

select pg_temp.ok(
  not pg_temp.refused($$select g.id, g.starts_at, g.price_thb, count(b.id)
                          from public.games g left join public.bookings b on b.game_id = g.id
                         group by g.id, g.starts_at, g.price_thb$$),
  'a games-with-bookings read as hq_readonly works');

-- =============================================================================
-- RESULTS
-- =============================================================================

select seq, case when passed then 'PASS' else 'FAIL' end as result, label, detail from _results order by seq;
select case when bool_and(passed) then 'ALL PASS' else 'HAS FAILURES' end as summary,
       count(*) filter (where passed) || '/' || count(*) as passed
  from _results;

rollback;
