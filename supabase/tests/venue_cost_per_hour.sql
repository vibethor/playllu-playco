-- =============================================================================
-- PLAYCO — a venue's price is per hour; a game costs that times its length.
--
-- The owner, 17 Nov 2026: "the venue cost is given per hour, I just created a
-- 2h game and it's showing the cost of the venue only for 1h". Bangkok courts
-- are rented by the hour (CLAUDE.md: "Venue costs per hour"); HrajFotbal's model
-- was one flat price per game.
--
--   * a new game costs venue price × duration ÷ 60, rounded to whole baht
--   * a game with no length is costed as one hour, the length the old flat
--     price stood for
--   * changing a game's length or venue recosts it, unless an admin set the
--     cost by hand
--   * clearing a hand-set cost puts the game back on price × length
--
-- Run:  node supabase/tests/run.mjs venue_cost_per_hour
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

create function pg_temp.act_as(p_uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
end $$;

create function pg_temp.cost(p_game uuid)
returns integer language sql as $$
  select cost_thb from public.game_pitch_costs where game_id = p_game
$$;

create function pg_temp.show(p_game uuid)
returns text language sql as $$
  select coalesce(pg_temp.cost(p_game)::text, 'null')
$$;

-- --- fixtures ----------------------------------------------------------------

insert into auth.users (id, email) values
  ('71000000-0000-0000-0000-000000000001', 'vcph-admin@test.invalid');
insert into public.players (id, nickname, email, auth_user_id, is_admin) values
  ('7e000000-0000-0000-0000-000000000001', 'VCPHAdmin', 'vcph-admin@test.invalid',
   '71000000-0000-0000-0000-000000000001', true);

insert into public.venues (id, name) values
  ('7c000000-0000-0000-0000-000000000001', 'VCPH Swish'),
  ('7c000000-0000-0000-0000-000000000002', 'VCPH Asoke');

-- One price, as the admin form saves it (the same value in both columns).
select pg_temp.act_as('71000000-0000-0000-0000-000000000001');
select public.set_venue_pitch_costs('7c000000-0000-0000-0000-000000000001', 1000, 1000);
select public.set_venue_pitch_costs('7c000000-0000-0000-0000-000000000002', 1200, 1200);
reset role;

-- =============================================================================
-- A NEW GAME COSTS PRICE × LENGTH
-- =============================================================================

insert into public.games (id, venue, venue_id, starts_at, capacity, price_thb, status, duration_minutes) values
  ('7a000000-0000-0000-0000-000000000001', 'VCPH Swish', '7c000000-0000-0000-0000-000000000001',
   now() + interval '3 days', 18, 300, 'published', 120),
  ('7a000000-0000-0000-0000-000000000002', 'VCPH Swish', '7c000000-0000-0000-0000-000000000001',
   now() + interval '3 days', 18, 300, 'published', 180),
  ('7a000000-0000-0000-0000-000000000003', 'VCPH Asoke', '7c000000-0000-0000-0000-000000000002',
   now() + interval '3 days', 15, 300, 'published', 90),
  ('7a000000-0000-0000-0000-000000000004', 'VCPH Asoke', '7c000000-0000-0000-0000-000000000002',
   now() + interval '3 days', 15, 300, 'published', null);

select pg_temp.ok(pg_temp.cost('7a000000-0000-0000-0000-000000000001') = 2000,
  'a 2-hour game at 1,000 an hour costs 2,000', pg_temp.show('7a000000-0000-0000-0000-000000000001'));
select pg_temp.ok(pg_temp.cost('7a000000-0000-0000-0000-000000000002') = 3000,
  'the 3-hour Sunday game costs 3,000', pg_temp.show('7a000000-0000-0000-0000-000000000002'));
select pg_temp.ok(pg_temp.cost('7a000000-0000-0000-0000-000000000003') = 1800,
  'ninety minutes at 1,200 an hour costs 1,800', pg_temp.show('7a000000-0000-0000-0000-000000000003'));
select pg_temp.ok(pg_temp.cost('7a000000-0000-0000-0000-000000000004') = 1200,
  'a game with no length is costed as one hour', pg_temp.show('7a000000-0000-0000-0000-000000000004'));

-- =============================================================================
-- CHANGING THE LENGTH OR THE VENUE RECOSTS THE GAME
-- =============================================================================

update public.games set duration_minutes = 180 where id = '7a000000-0000-0000-0000-000000000001';
select pg_temp.ok(pg_temp.cost('7a000000-0000-0000-0000-000000000001') = 3000,
  'lengthening a game to 3 hours recosts it', pg_temp.show('7a000000-0000-0000-0000-000000000001'));

update public.games set venue_id = '7c000000-0000-0000-0000-000000000002'
 where id = '7a000000-0000-0000-0000-000000000001';
select pg_temp.ok(pg_temp.cost('7a000000-0000-0000-0000-000000000001') = 3600,
  'moving it to a dearer court recosts it at that court''s price', pg_temp.show('7a000000-0000-0000-0000-000000000001'));

update public.games set notes = 'bring water' where id = '7a000000-0000-0000-0000-000000000003';
select pg_temp.ok(pg_temp.cost('7a000000-0000-0000-0000-000000000003') = 1800,
  'an edit that changes neither leaves the cost alone', pg_temp.show('7a000000-0000-0000-0000-000000000003'));

-- =============================================================================
-- A HAND-SET COST STAYS UNTIL IT IS CLEARED
-- =============================================================================

select pg_temp.act_as('71000000-0000-0000-0000-000000000001');
select public.set_game_pitch_cost('7a000000-0000-0000-0000-000000000002', 2500);
reset role;
update public.games set duration_minutes = 120 where id = '7a000000-0000-0000-0000-000000000002';
select pg_temp.ok(pg_temp.cost('7a000000-0000-0000-0000-000000000002') = 2500,
  'a cost an admin typed survives a change of length', pg_temp.show('7a000000-0000-0000-0000-000000000002'));

select pg_temp.act_as('71000000-0000-0000-0000-000000000001');
select public.set_game_pitch_cost('7a000000-0000-0000-0000-000000000002', null);
reset role;
select pg_temp.ok(pg_temp.cost('7a000000-0000-0000-0000-000000000002') = 2000,
  'clearing it puts the game back on price × its current length', pg_temp.show('7a000000-0000-0000-0000-000000000002'));

-- =============================================================================
-- PROFIT USES THE WHOLE COST
-- =============================================================================

select pg_temp.act_as('71000000-0000-0000-0000-000000000001');
select pg_temp.ok(
  (select pitch_cost_thb = 2000 and break_even_seats = 7
     from public.game_economics(array['7a000000-0000-0000-0000-000000000002'::uuid])),
  'a 2-hour game at 1,000 an hour and 300 a seat breaks even at 7 seats',
  (select pitch_cost_thb || ' / ' || coalesce(break_even_seats::text, 'null')
     from public.game_economics(array['7a000000-0000-0000-0000-000000000002'::uuid])));
reset role;

select seq, label, case when passed then 'PASS' else 'FAIL' end as result, detail
from _results order by seq;

select count(*) as total,
       count(*) filter (where passed) as passed,
       count(*) filter (where not passed) as failed,
       case when count(*) filter (where not passed) = 0
            then 'ALL PASS' else 'HAS FAILURES' end as summary
from _results;

rollback;
