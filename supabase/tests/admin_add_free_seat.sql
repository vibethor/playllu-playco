-- =============================================================================
-- admin_add_free_seat — an admin adds a player to an upcoming game, free (Jachym, 17 Nov 2026)
--
-- Run:  node supabase/tests/run.mjs admin_add_free_seat
--
-- "Make it in the admin panel that I can ... add them to an upcoming game", and the spot is free (his answer: like a
-- staff seat, no charge). The booking is confirmed, costs nothing, is marked booked_by_admin, and is refused for a
-- non-admin, a past or unpublished game, a full game, and a player who already holds a spot.
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

-- What a call returns: 'ok' or the error code it raised.
create function pg_temp.try_add(p_actor uuid, p_game uuid, p_player uuid)
returns text language plpgsql as $$
begin
  perform pg_temp.act_as(p_actor);
  perform public.admin_add_free_seat(p_game, p_player);
  perform set_config('role', 'postgres', true);
  return 'ok';
exception when others then
  perform set_config('role', 'postgres', true);
  return sqlerrm;
end $$;

-- --- fixtures ----------------------------------------------------------------

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-00000000fa01'::uuid, 'afs-admin@test.invalid'),
  ('a0000000-0000-0000-0000-00000000fa02'::uuid, 'afs-player@test.invalid'),
  ('a0000000-0000-0000-0000-00000000fa03'::uuid, 'afs-other@test.invalid');

insert into public.players (id, nickname, email, auth_user_id, is_admin) values
  ('af000000-0000-0000-0000-00000000fa01'::uuid, 'FreeSeatAdmin', 'afs-admin@test.invalid',
   'a0000000-0000-0000-0000-00000000fa01'::uuid, true),
  ('af000000-0000-0000-0000-00000000fa02'::uuid, 'FreeSeatPlayer', 'afs-player@test.invalid',
   'a0000000-0000-0000-0000-00000000fa02'::uuid, false),
  ('af000000-0000-0000-0000-00000000fa03'::uuid, 'FreeSeatOther', 'afs-other@test.invalid',
   'a0000000-0000-0000-0000-00000000fa03'::uuid, false);

insert into public.venues (id, name) values ('af000000-0000-0000-0000-0000000fe001'::uuid, 'Free Seat Hall');

insert into public.games (id, venue, venue_id, starts_at, capacity, price_thb, status, game_number) values
  ('af000000-0000-0000-0000-0000000ea001'::uuid, 'Free Seat Hall', 'af000000-0000-0000-0000-0000000fe001'::uuid,
   now() + interval '3 days', 2, 250, 'published', 990001),
  ('af000000-0000-0000-0000-0000000ea002'::uuid, 'Free Seat Hall', 'af000000-0000-0000-0000-0000000fe001'::uuid,
   now() - interval '1 day', 10, 250, 'published', 990002),
  ('af000000-0000-0000-0000-0000000ea003'::uuid, 'Free Seat Hall', 'af000000-0000-0000-0000-0000000fe001'::uuid,
   now() + interval '3 days', 10, 250, 'draft', 990003);

-- =============================================================================
-- THE HAPPY PATH
-- =============================================================================

select pg_temp.ok(
  pg_temp.try_add('a0000000-0000-0000-0000-00000000fa01', 'af000000-0000-0000-0000-0000000ea001',
                  'af000000-0000-0000-0000-00000000fa02') = 'ok',
  'an admin adds a player to an upcoming game');

select pg_temp.ok(
  (select status = 'confirmed' and price_thb = 0 and credit_applied_thb = 0 and booked_by_admin
          and payment_method = 'seed_free' and guest_count = 0
     from public.bookings
    where game_id = 'af000000-0000-0000-0000-0000000ea001' and player_id = 'af000000-0000-0000-0000-00000000fa02'),
  'the spot is confirmed, free, and marked as added by an admin');

select pg_temp.ok(
  (select count(*) = 0 from public.credit_ledger where player_id = 'af000000-0000-0000-0000-00000000fa02'),
  'nothing is taken from or given to the wallet');

select pg_temp.ok(
  (select count(*) = 1 from public.events
    where event_type = 'admin_booking_created' and player_id = 'af000000-0000-0000-0000-00000000fa02'
      and metadata ->> 'free' = 'true'
      and metadata ->> 'acting_admin_player_id' = 'af000000-0000-0000-0000-00000000fa01'),
  'the audit trail names the admin who added them');

-- =============================================================================
-- REFUSALS
-- =============================================================================

select pg_temp.ok(
  pg_temp.try_add('a0000000-0000-0000-0000-00000000fa01', 'af000000-0000-0000-0000-0000000ea001',
                  'af000000-0000-0000-0000-00000000fa02') like '%DUPLICATE_ACTIVE_BOOKING%',
  'a player who already holds a spot is refused by name');

select pg_temp.ok(
  pg_temp.try_add('a0000000-0000-0000-0000-00000000fa02', 'af000000-0000-0000-0000-0000000ea001',
                  'af000000-0000-0000-0000-00000000fa03') like '%INSUFFICIENT_PERMISSION%',
  'a player who is not an admin cannot add anyone');

select pg_temp.ok(
  pg_temp.try_add('a0000000-0000-0000-0000-00000000fa01', 'af000000-0000-0000-0000-0000000ea002',
                  'af000000-0000-0000-0000-00000000fa03') like '%GAME_ALREADY_STARTED%',
  'a game that has started is refused');

select pg_temp.ok(
  pg_temp.try_add('a0000000-0000-0000-0000-00000000fa01', 'af000000-0000-0000-0000-0000000ea003',
                  'af000000-0000-0000-0000-00000000fa03') like '%GAME_NOT_BOOKABLE%',
  'an unpublished game is refused');

-- Fill the last seat, then try one more.
select pg_temp.ok(
  pg_temp.try_add('a0000000-0000-0000-0000-00000000fa01', 'af000000-0000-0000-0000-0000000ea001',
                  'af000000-0000-0000-0000-00000000fa03') = 'ok',
  'the second of two seats can be filled');

select pg_temp.ok(
  (select status = 'full' from public.games where id = 'af000000-0000-0000-0000-0000000ea001'),
  'filling the last seat marks the game full, as any booking does');

select pg_temp.ok(
  pg_temp.try_add('a0000000-0000-0000-0000-00000000fa01', 'af000000-0000-0000-0000-0000000ea001',
                  'af000000-0000-0000-0000-00000000fa01') like '%CAPACITY_FULL%',
  'a full game is refused: an admin raises the capacity first');

select pg_temp.ok(
  not has_function_privilege('anon', 'public.admin_add_free_seat(uuid, uuid)', 'execute'),
  'signed-out visitors cannot call it at all');

select seq, label, case when passed then 'PASS' else 'FAIL' end as result, detail
from _results order by seq;

select count(*) as total,
       count(*) filter (where passed) as passed,
       count(*) filter (where not passed) as failed,
       case when count(*) filter (where not passed) = 0
            then 'ALL PASS' else 'HAS FAILURES' end as summary
from _results;

rollback;
