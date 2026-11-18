-- =============================================================================
-- weekly_games — "Make this game recurring?" (Jachym, 18 Nov 2026)
--
-- Run:  node supabase/tests/run.mjs weekly_games
--
-- A recurring game gets next week's copy, published, same weekday and wall-clock time, same settings and organiser.
-- A second sweep makes nothing new. Unticking stops the chain from wherever it is unticked. A cancelled week does not
-- stop it. Only an admin or the service role may sweep.
-- =============================================================================

begin;

create temp table _results (
  seq serial primary key, label text, passed boolean, detail text
) on commit drop;

create function pg_temp.ok(cond boolean, label text, detail text default '')
returns void language plpgsql security definer as $$
begin
  insert into _results (label, passed, detail) values (label, cond, detail);
end $$;

create function pg_temp.act_as(p_uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
end $$;

create function pg_temp.as_service()
returns void language plpgsql as $$
begin
  perform set_config('role', 'service_role', true);
  perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
end $$;

create function pg_temp.reset()
returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

create function pg_temp.sweep_as(p_uid uuid)
returns text language plpgsql as $$
declare v integer;
begin
  perform pg_temp.act_as(p_uid);
  v := public.extend_weekly_games(8);
  perform pg_temp.reset();
  return v::text;
exception when others then
  perform pg_temp.reset();
  return sqlerrm;
end $$;

-- --- fixtures ----------------------------------------------------------------

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-0000000eeb01'::uuid, 'wg-admin@test.invalid'),
  ('a0000000-0000-0000-0000-0000000eeb02'::uuid, 'wg-player@test.invalid');

insert into public.players (id, nickname, email, auth_user_id, is_admin) values
  ('eb000000-0000-0000-0000-0000000eeb01'::uuid, 'WeeklyAdmin', 'wg-admin@test.invalid',
   'a0000000-0000-0000-0000-0000000eeb01'::uuid, true),
  ('eb000000-0000-0000-0000-0000000eeb02'::uuid, 'WeeklyPlayer', 'wg-player@test.invalid',
   'a0000000-0000-0000-0000-0000000eeb02'::uuid, false);

insert into public.venues (id, name) values ('eb000000-0000-0000-0000-0000000fe001'::uuid, 'Weekly Hall');

-- Game A: recurring, in 12 hours (so next week is 7.5 days out, inside the 8-day horizon). Game B: not recurring. Game C: recurring but a draft.
insert into public.games (id, venue, venue_id, starts_at, capacity, price_thb, status, game_number,
                          format, surface, duration_minutes, subs_per_team, language, notes, repeats_weekly) values
  ('eb000000-0000-0000-0000-0000000ea001'::uuid, 'Weekly Hall', 'eb000000-0000-0000-0000-0000000fe001'::uuid,
   date_trunc('minute', now()) + interval '12 hours', 18, 300, 'published', 980001,
   '6v6v6', 'indoor', 120, 2, 'en-th', 'Bring water', true),
  ('eb000000-0000-0000-0000-0000000ea002'::uuid, 'Weekly Hall', 'eb000000-0000-0000-0000-0000000fe001'::uuid,
   now() + interval '2 days', 18, 300, 'published', 980002, '6v6', 'indoor', 120, null, 'en-th', null, false),
  ('eb000000-0000-0000-0000-0000000ea003'::uuid, 'Weekly Hall', 'eb000000-0000-0000-0000-0000000fe001'::uuid,
   now() + interval '2 days', 18, 300, 'draft', 980003, '6v6', 'indoor', 120, null, 'en-th', null, true);

insert into public.game_organizer_contacts (game_id, organizer_name, organizer_phone, organizer_player_id) values
  ('eb000000-0000-0000-0000-0000000ea001'::uuid, 'WeeklyAdmin', '+10000000', 'eb000000-0000-0000-0000-0000000eeb01'::uuid);

-- =============================================================================
-- PERMISSIONS
-- =============================================================================

select pg_temp.ok(
  pg_temp.sweep_as('a0000000-0000-0000-0000-0000000eeb02') like '%INSUFFICIENT_PERMISSION%',
  'a player cannot run the sweep');

select pg_temp.ok(
  not has_function_privilege('anon', 'public.extend_weekly_games(integer)', 'execute'),
  'signed-out visitors cannot call it at all');

-- =============================================================================
-- THE HAPPY PATH
-- =============================================================================

select pg_temp.ok(
  pg_temp.sweep_as('a0000000-0000-0000-0000-0000000eeb01') = '1',
  'an admin sweep makes exactly one game: next week of the recurring one');

select pg_temp.ok(
  (select count(*) = 1 from public.games where repeats_from = 'eb000000-0000-0000-0000-0000000ea001'),
  'the copy points back at the game it came from');

select pg_temp.ok(
  (select n.status = 'published'
          and n.starts_at = ((a.starts_at at time zone public.app_timezone()) + interval '7 days') at time zone public.app_timezone()
          and n.venue_id = a.venue_id and n.capacity = 18 and n.price_thb = 300
          and n.format = '6v6v6' and n.surface = 'indoor' and n.duration_minutes = 120
          and n.subs_per_team = 2 and n.language = 'en-th' and n.notes = 'Bring water'
          and n.repeats_weekly and n.guest_count = 0
     from public.games n join public.games a on a.id = n.repeats_from
    where a.id = 'eb000000-0000-0000-0000-0000000ea001'),
  'next week: published, same weekday and time, same settings, still recurring');

select pg_temp.ok(
  (select c.organizer_name = 'WeeklyAdmin' and c.organizer_player_id = 'eb000000-0000-0000-0000-0000000eeb01'
     from public.game_organizer_contacts c join public.games n on n.id = c.game_id
    where n.repeats_from = 'eb000000-0000-0000-0000-0000000ea001'),
  'the organiser comes along');

select pg_temp.ok(
  (select count(*) = 1 from public.game_pitch_costs p join public.games n on n.id = p.game_id
    where n.repeats_from = 'eb000000-0000-0000-0000-0000000ea001'),
  'the venue cost follows, as for any new game');

select pg_temp.ok(
  (select count(*) = 1 from public.events e join public.games n on n.id = e.game_id
    where n.repeats_from = 'eb000000-0000-0000-0000-0000000ea001' and e.event_type = 'game_published'),
  'a game_published event is written');

select pg_temp.ok(
  (select count(*) = 0 from public.games where repeats_from in
     ('eb000000-0000-0000-0000-0000000ea002', 'eb000000-0000-0000-0000-0000000ea003')),
  'a non-recurring game and a draft are left alone');

select pg_temp.ok(
  pg_temp.sweep_as('a0000000-0000-0000-0000-0000000eeb01') = '0',
  'a second sweep makes nothing: the week after is still beyond the horizon');

-- =============================================================================
-- CANCELLING A WEEK, AND STOPPING THE SERIES
-- =============================================================================

-- Pretend a week went by: the copy is now the tip and is 12 hours out; cancel it.
update public.games set starts_at = starts_at - interval '7 days', status = 'cancelled'
 where repeats_from = 'eb000000-0000-0000-0000-0000000ea001';
update public.games set starts_at = starts_at - interval '7 days'
 where id = 'eb000000-0000-0000-0000-0000000ea001';

select pg_temp.ok(
  pg_temp.sweep_as('a0000000-0000-0000-0000-0000000eeb01') = '1',
  'a cancelled week does not stop the series: the week after it is made');

select pg_temp.act_as('a0000000-0000-0000-0000-0000000eeb01');
select public.set_game_repeats_weekly('eb000000-0000-0000-0000-0000000ea001', false);
select pg_temp.reset();

select pg_temp.ok(
  (with recursive chain(id) as (
      select 'eb000000-0000-0000-0000-0000000ea001'::uuid
      union all select g.id from public.games g join chain c on g.repeats_from = c.id)
   select count(*) = 3 and bool_and(not g.repeats_weekly) from public.games g join chain using (id)),
  'unticking turns it off for that game and every later copy');

update public.games set starts_at = starts_at - interval '7 days'
 where id in (with recursive chain(id) as (
      select 'eb000000-0000-0000-0000-0000000ea001'::uuid
      union all select g.id from public.games g join chain c on g.repeats_from = c.id) select id from chain);

select pg_temp.ok(
  pg_temp.sweep_as('a0000000-0000-0000-0000-0000000eeb01') = '0',
  'once unticked, nothing more is made');

select pg_temp.as_service();
select public.set_game_repeats_weekly('eb000000-0000-0000-0000-0000000ea001', true);
select pg_temp.ok(public.extend_weekly_games(8) = 1, 'ticking again restarts it from the newest game, via the service role (cron)');
select pg_temp.reset();

select pg_temp.ok(
  (with recursive chain(id) as (
      select 'eb000000-0000-0000-0000-0000000ea001'::uuid
      union all select g.id from public.games g join chain c on g.repeats_from = c.id)
   select count(*) = 4 and max(g.starts_at) > now() + interval '7 days'
     from public.games g join chain using (id)),
  'ticking again adds one week after the newest game, nothing more');

select seq, label, case when passed then 'PASS' else 'FAIL' end as result, detail
from _results order by seq;

select count(*) as total,
       count(*) filter (where passed) as passed,
       count(*) filter (where not passed) as failed,
       case when count(*) filter (where not passed) = 0
            then 'ALL PASS' else 'HAS FAILURES' end as summary
from _results;

rollback;
