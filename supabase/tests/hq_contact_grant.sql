-- =============================================================================
-- HQ's contact grant on Playco (Jachym, 19 Nov 2026)
--
-- Run:  psql -f supabase/roles/hq_readonly.sql   (once, after the migrations — the role is not a migration)
--       node supabase/tests/run.mjs hq_contact_grant
--
-- supabase/roles/hq_contact_grant.sql gives hq_readonly players.email and players.phone and nothing else. This suite
-- applies that one statement inside its own transaction (the same text as the file), checks what it opens and what
-- stays shut, revokes it, and rolls back, so the database is left exactly as it was and hq_readonly_role.sql (the role
-- without the contact grant) keeps passing whatever order the suites run in.
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
-- BEFORE THE GRANT: the role alone reads no contact details
-- =============================================================================

select pg_temp.ok(not has_column_privilege('hq_readonly', 'public.players', 'email', 'SELECT'),
  'before the grant: cannot read players.email');
select pg_temp.ok(not has_column_privilege('hq_readonly', 'public.players', 'phone', 'SELECT'),
  'before the grant: cannot read players.phone');

-- =============================================================================
-- THE GRANT (the statement in supabase/roles/hq_contact_grant.sql)
-- =============================================================================

grant select (email, phone) on public.players to hq_readonly;

select pg_temp.ok(has_column_privilege('hq_readonly', 'public.players', 'email', 'SELECT'),
  'after the grant: can read players.email');
select pg_temp.ok(has_column_privilege('hq_readonly', 'public.players', 'phone', 'SELECT'),
  'after the grant: can read players.phone');
select pg_temp.ok(not pg_temp.refused('select id, nickname, email, phone from public.players limit 1'),
  'after the grant: selecting id, nickname, email and phone as hq_readonly works');

-- What stays shut with the grant in place.
select pg_temp.ok(not has_column_privilege('hq_readonly', 'public.players', 'auth_user_id', 'SELECT'),
  'after the grant: still cannot read players.auth_user_id');
select pg_temp.ok(pg_temp.refused('select * from public.players limit 1'),
  'after the grant: select * on players is still refused (auth ids are not granted)');
select pg_temp.ok(not has_column_privilege('hq_readonly', 'public.bookings', 'payment_code', 'SELECT'),
  'after the grant: still cannot read bookings.payment_code');
select pg_temp.ok(
  not exists (
    select 1 from information_schema.column_privileges
     where grantee = 'hq_readonly' and table_schema = 'public'
       and table_name in ('banned_phones', 'consent_records', 'game_organizer_contacts')),
  'after the grant: still reads nothing from banned phones, consent records or organiser contacts');
select pg_temp.ok(
  not exists (
    select 1 from information_schema.column_privileges
     where grantee = 'hq_readonly' and table_schema = 'public' and privilege_type <> 'SELECT'),
  'after the grant: holds no column privilege other than SELECT');
select pg_temp.ok(pg_temp.refused($$update public.players set nickname = nickname where false$$),
  'after the grant: an update of players as hq_readonly is refused');

-- =============================================================================
-- THE REVOKE (the commented line at the foot of the file)
-- =============================================================================

revoke select (email, phone) on public.players from hq_readonly;

select pg_temp.ok(not has_column_privilege('hq_readonly', 'public.players', 'email', 'SELECT')
              and not has_column_privilege('hq_readonly', 'public.players', 'phone', 'SELECT'),
  'after the revoke: email and phone are unreadable again');
select pg_temp.ok(has_column_privilege('hq_readonly', 'public.players', 'nickname', 'SELECT'),
  'after the revoke: the contract columns (nickname) are untouched');

-- =============================================================================
-- RESULTS
-- =============================================================================

select seq, case when passed then 'PASS' else 'FAIL' end as result, label, detail from _results order by seq;
select case when bool_and(passed) then 'ALL PASS' else 'HAS FAILURES' end as summary,
       count(*) filter (where passed) || '/' || count(*) as passed
  from _results;

rollback;
