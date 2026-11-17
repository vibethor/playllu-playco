-- =============================================================================
-- PLAYCO, PHASE F — the Bangkok flow at Bangkok prices, end to end in the database.
--   psql "$DB" -f supabase/tests/playco_bangkok_prices.sql      (local throwaway database only)
-- =============================================================================
-- =============================================================================
-- Phase 5 assertions — create_booking + admin_create_booking
--
-- Run:  psql "$SUPABASE_DB_URL" -f supabase/tests/booking_create.sql
--
-- Transaction-wrapped and rolled back. Asserts DATABASE STATE, never timing.
--
-- Scope note: the genuine concurrency races (two callers contending for the
-- last spot; one player spending one balance across two games at once) cannot
-- be expressed from a single session — one session cannot block against
-- itself, and an advisory lock taken twice in one transaction is simply
-- re-entrant. Those two live in supabase/tests/concurrency/booking_race.mjs,
-- which drives real concurrent connections. This file covers everything that
-- is decidable sequentially, which is the large majority of the contract.
-- =============================================================================

begin;

-- --- harness -----------------------------------------------------------------

create temp table _results (
  seq serial primary key, label text, passed boolean, detail text
) on commit drop;

create function pg_temp.ok(cond boolean, label text, detail text default '')
returns void language plpgsql security definer as $$
begin
  insert into _results (label, passed, detail) values (label, cond, detail);
end $$;

-- Returns rows:N | denied | raise:<message> | error:<sqlstate>.
-- The `raise:` form matters here: this phase's contract is expressed almost
-- entirely in named errors (CAPACITY_FULL, DUPLICATE_ACTIVE_BOOKING,
-- INSUFFICIENT_PERMISSION), so asserting the MESSAGE rather than a generic
-- "it failed" is what makes these assertions worth anything.
create function pg_temp.probe(sql text)
returns text language plpgsql as $$
declare n integer;
begin
  -- A CTE, not a subquery: this wrapper has to accept INSERT/UPDATE ...
  -- RETURNING as well as SELECT, and only a data-modifying CTE allows that.
  --
  -- The rows are CONSUMED, not just counted. `count(*)` never reads a column
  -- of the CTE, so for a non-volatile function under test the planner prunes
  -- the call out of the plan entirely and the executor never performs the
  -- privilege check — the probe then reports `rows:1` where a direct call is
  -- denied, which is a FALSE PASS on exactly the assertions these suites exist
  -- to make. `count(<expr>)` must evaluate its argument, and casting the whole
  -- row to text drags every column (and therefore every function call) into
  -- that evaluation. Verified against `public.waitlist_position` as `anon`:
  -- count(*) says rows:1, count(_p::text) says denied. Wrapping the cast in a
  -- subquery is NOT enough — the pruning just moves up a level. Same reasoning
  -- as `call_position()` in waitlist_position.sql, which hit this first.
  -- `_p::text` is never NULL (an all-NULL row casts to '()'), so the count
  -- still equals the row count.
  execute 'with _p as (' || sql || ') select count(_p::text) from _p' into n;
  return 'rows:' || n;
exception
  when insufficient_privilege then return 'denied';
  when others then
    if sqlstate = 'P0001' then return 'raise:' || sqlerrm; end if;
    return 'error:' || sqlstate;
end $$;

-- Evaluates `sql` EXACTLY ONCE and records both the verdict and what actually
-- happened. The naive form — pg_temp.ok(probe(x) = expected, label, probe(x))
-- — runs the statement twice, which is harmless for a probe that raises but
-- silently double-executes one that succeeds. SECURITY INVOKER on purpose, so
-- the probe still runs as the current test role; only pg_temp.ok (definer)
-- touches the results table.
create function pg_temp.ok_probe(sql text, expected text, label text)
returns void language plpgsql as $$
declare r text;
begin
  r := pg_temp.probe(sql);
  perform pg_temp.ok(r = expected, label, r);
end $$;

create function pg_temp.act_as(p_uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
end $$;

create function pg_temp.act_as_service()
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
end $$;

-- --- fixtures ----------------------------------------------------------------


insert into auth.users (id, email) values ('a0000000-0000-0000-0000-0000000000a1', 'bkk@test.invalid');
insert into public.players (id, nickname, email, auth_user_id) values
  ('aaaa0000-0000-0000-0000-00000000000a', 'TstBangkok', 'bkk@test.invalid', 'a0000000-0000-0000-0000-0000000000a1');

-- A standard 2-hour game a week out, priced the way the admin form prefills it.
insert into public.games (id, venue, starts_at, capacity, price_thb, status, duration_minutes) values
  ('9b000000-0000-0000-0000-000000000001', 'Swish Elite 50', now() + interval '7 days', 18,
   public.price_for_duration(120), 'published', 120);

-- 300 THB for every game (Jachym, 17 Nov 2026; was 250, with 300 for the beach and the Sunday game). Typed here on
-- purpose: this suite pins the Bangkok rule, so an accidental price change fails it.
select pg_temp.ok(public.price_for_duration(120) = 300, 'a 2-hour game prefills 300 THB');
select pg_temp.ok(public.price_for_duration(180) = 300, 'the 3-hour Sunday game prefills 300 THB');
select pg_temp.ok(public.credit_seat_price_thb() = 300, 'one wallet credit is worth one 300 THB seat');
select pg_temp.ok(public.app_timezone() = 'Asia/Bangkok', 'SQL formats datetimes in Bangkok time');
select pg_temp.ok(
  (select g.city || '/' || g.brand from public.games g where g.id = '9b000000-0000-0000-0000-000000000001') = 'bangkok/playco',
  'a new game is stamped bangkok / playco');

-- 300 in the wallet books the 300 game outright.
insert into public.credit_ledger (player_id, delta_thb, reason) values ('aaaa0000-0000-0000-0000-00000000000a', 300, 'admin_grant');
select pg_temp.act_as('a0000000-0000-0000-0000-0000000000a1');
select pg_temp.ok(
  (select (public.create_booking('9b000000-0000-0000-0000-000000000001', 'cash')).payment_method) = 'credit',
  'a wallet holding 300 books the game from credit');
reset role;
select pg_temp.ok(
  (select coalesce(sum(delta_thb), 0) from public.credit_ledger where player_id = 'aaaa0000-0000-0000-0000-00000000000a') = 0,
  'the wallet is empty after the booking');
select pg_temp.ok(
  (select status::text from public.bookings where player_id = 'aaaa0000-0000-0000-0000-00000000000a') = 'confirmed',
  'the booking is confirmed');

-- Cancelling a week ahead (well outside the 12-hour cutoff) returns the seat to the wallet.
select pg_temp.act_as('a0000000-0000-0000-0000-0000000000a1');
select public.cancel_booking((select id from public.bookings where player_id = 'aaaa0000-0000-0000-0000-00000000000a'));
reset role;
select pg_temp.ok(
  (select coalesce(sum(delta_thb), 0) from public.credit_ledger where player_id = 'aaaa0000-0000-0000-0000-00000000000a') = 300,
  'cancelling in time puts 300 back in the wallet');

select seq, label, case when passed then 'PASS' else 'FAIL' end, detail from _results order by seq;
select count(*) filter (where passed), count(*) filter (where not passed),
       case when bool_and(passed) then 'ALL PASS' else 'HAS FAILURES' end from _results;
rollback;
