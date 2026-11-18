-- =============================================================================
-- settle_already_booked — the PromptPay double payment (Phase F check 7b, open since 16 Nov 2026)
--
-- Run:  node supabase/tests/run.mjs settle_already_booked
--
-- A player who already holds a spot opens a second checkout and pays (PromptPay settles later than a card, so two
-- forms can be open at once). `settle_checkout_session` used to insert a second booking, hit the one-active-booking-
-- per-player index, and raise; the webhook then fell through to the legacy path, which answered "unknown". Stripe kept
-- the money, the session stayed open, and the player got nothing. Now the payment is credited to the wallet in full,
-- the session is closed and flagged, and the player is told why.
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

create function pg_temp.settle_as_service(p_session text, p_amount integer)
returns text language plpgsql as $$
declare v text;
begin
  perform set_config('role', 'service_role', true);
  perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
  v := public.settle_checkout_session(p_session, p_amount);
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
  return v;
exception when others then
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
  return 'error: ' || sqlerrm;
end $$;

-- --- fixtures ----------------------------------------------------------------

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-0000000dab01', 'dup-booked@test.invalid'),
  ('a0000000-0000-0000-0000-0000000dab02', 'dup-new@test.invalid');

insert into public.players (id, nickname, email, auth_user_id) values
  ('dab00000-0000-0000-0000-0000000dab01', 'AlreadyIn', 'dup-booked@test.invalid',
   'a0000000-0000-0000-0000-0000000dab01'),
  ('dab00000-0000-0000-0000-0000000dab02', 'NewPayer', 'dup-new@test.invalid',
   'a0000000-0000-0000-0000-0000000dab02');

insert into public.games (id, venue, starts_at, capacity, price_thb, status, duration_minutes, game_number) values
  ('dab00000-0000-0000-0000-00000000ea01', 'Double Pay Hall', now() + interval '2 days', 10, 300, 'published', 120,
   970001);

-- AlreadyIn holds a paid spot.
insert into public.bookings (id, game_id, player_id, status, payment_method, price_thb, credit_applied_thb, guest_count,
                             stripe_session_id)
values ('dab00000-0000-0000-0000-0000000b0001', 'dab00000-0000-0000-0000-00000000ea01',
        'dab00000-0000-0000-0000-0000000dab01', 'confirmed', 'qr', 300, 0, 0, 'cs_test_first_payment');

-- ...and a second checkout of theirs for the same game, plus a normal one for NewPayer.
insert into public.checkout_sessions (stripe_session_id, game_id, player_id, guest_count, amount_thb, kind) values
  ('cs_test_second_payment', 'dab00000-0000-0000-0000-00000000ea01', 'dab00000-0000-0000-0000-0000000dab01', 0, 300,
   'booking'),
  ('cs_test_new_payer', 'dab00000-0000-0000-0000-00000000ea01', 'dab00000-0000-0000-0000-0000000dab02', 0, 300,
   'booking');

-- =============================================================================
-- THE DOUBLE PAYMENT
-- =============================================================================

select pg_temp.ok(
  pg_temp.settle_as_service('cs_test_second_payment', 300) = 'credited',
  'a second payment from a player who already holds a spot settles as credited, not an error');

select pg_temp.ok(
  (select status = 'credited' and attention_at is not null and booking_id is null
          and attention_reason like '%already%'
     from public.checkout_sessions where stripe_session_id = 'cs_test_second_payment'),
  'the session is closed, flagged for attention, and says why');

select pg_temp.ok(
  (select coalesce(sum(delta_thb), 0) = 300 from public.credit_ledger
    where player_id = 'dab00000-0000-0000-0000-0000000dab01'),
  'the full 300 is in their wallet');

select pg_temp.ok(
  (select count(*) = 1 from public.bookings
    where player_id = 'dab00000-0000-0000-0000-0000000dab01'
      and game_id = 'dab00000-0000-0000-0000-00000000ea01' and status in ('reserved', 'confirmed')),
  'they still hold exactly one spot');

select pg_temp.ok(
  (select count(*) = 1 from public.notifications
    where recipient_id = 'dab00000-0000-0000-0000-0000000dab01' and title ilike '%already%'),
  'they are told they already had a spot and where the money went');

select pg_temp.ok(
  pg_temp.settle_as_service('cs_test_second_payment', 300) = 'already',
  'a Stripe retry of the same event changes nothing');

select pg_temp.ok(
  (select coalesce(sum(delta_thb), 0) = 300 from public.credit_ledger
    where player_id = 'dab00000-0000-0000-0000-0000000dab01'),
  'and is not credited twice');

-- =============================================================================
-- THE NORMAL PAYMENT STILL BOOKS
-- =============================================================================

select pg_temp.ok(
  pg_temp.settle_as_service('cs_test_new_payer', 300) = 'booked',
  'a player without a spot is booked as before');

select pg_temp.ok(
  (select count(*) = 1 from public.bookings
    where player_id = 'dab00000-0000-0000-0000-0000000dab02' and status = 'confirmed'),
  'their booking exists and is confirmed');

select seq, label, case when passed then 'PASS' else 'FAIL' end as result, detail
from _results order by seq;

select count(*) as total,
       count(*) filter (where passed) as passed,
       count(*) filter (where not passed) as failed,
       case when count(*) filter (where not passed) = 0
            then 'ALL PASS' else 'HAS FAILURES' end as summary
from _results;

rollback;
