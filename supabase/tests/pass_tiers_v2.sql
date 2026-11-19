-- =============================================================================
-- PLAYCO GAME PASSES v2 (Jachym, 19 Nov 2026)
--
-- Run:  node supabase/tests/run.mjs pass_tiers_v2
--
-- Transaction-wrapped and rolled back.
--
--   5 games   1,400 THB   280 a game   valid 30 days
--   8 games   2,080 THB   260 a game   valid 45 days
--   12 games  2,880 THB   240 a game   valid 60 days
--   20 games  4,400 THB   220 a game   valid 90 days
--
-- What it pins: the four rows, and that a pass's credit batch expires after ITS
-- OWN validity rather than the flat credit_validity_days() every top-up got since
-- round 40. Ordinary top-ups and card-paid seats keep credit_validity_days().
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

-- The Stripe webhook confirms a purchase as the service role.
create function pg_temp.as_service()
returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
end $$;

-- --- fixtures ----------------------------------------------------------------

insert into auth.users (id, email) values
  ('60000000-0000-0000-0000-0000000f7b01'::uuid, 'pv2-a@test.invalid');

insert into public.players (id, nickname, email, auth_user_id) values
  ('6f7b0000-0000-0000-0000-0000000f7b01'::uuid, 'PassV2Buyer', 'pv2-a@test.invalid',
   '60000000-0000-0000-0000-0000000f7b01'::uuid);

-- --- the rows ----------------------------------------------------------------

select pg_temp.ok(
  (select string_agg(games || ':' || price_thb || ':' || validity_days, ',' order by games) from public.pass_tiers)
    = '5:1400:30,8:2080:45,12:2880:60,20:4400:90',
  'the passes are 5/1,400/30d, 8/2,080/45d, 12/2,880/60d and 20/4,400/90d',
  (select string_agg(games || ':' || price_thb || ':' || validity_days, ',' order by games) from public.pass_tiers));

select pg_temp.ok(
  not exists (select 1 from public.pass_tiers where credited_thb <> games * public.credit_seat_price_thb()),
  'every pass still credits one 300 THB seat per game');

select pg_temp.ok(
  not exists (select 1 from public.pass_tiers where validity_days is null),
  'every pass states its own validity');

-- --- confirming each pass dates its batch from the tier ----------------------

do $$
declare
  t        public.pass_tiers;
  v_topup  public.credit_topups;
  v_exp    timestamptz;
begin
  for t in select * from public.pass_tiers order by games loop
    perform pg_temp.act_as('60000000-0000-0000-0000-0000000f7b01'::uuid);
    v_topup := public.begin_pass_purchase(t.games);
    perform pg_temp.as_service();

    perform public.confirm_topup(v_topup.id, null, t.price_thb);

    select expires_at into v_exp
      from public.credit_ledger
     where player_id = '6f7b0000-0000-0000-0000-0000000f7b01'
       and reason = 'topup' and delta_thb = t.credited_thb
     order by expires_at desc limit 1;

    perform pg_temp.ok(
      v_exp = now() + make_interval(days => t.validity_days),
      format('the %s-game pass expires %s days after purchase', t.games, t.validity_days),
      coalesce(v_exp::text, 'no batch'));
  end loop;
end $$;

-- --- an ordinary top-up is unchanged -----------------------------------------

do $$
declare
  v_topup public.credit_topups;
  v_exp   timestamptz;
begin
  perform pg_temp.act_as('60000000-0000-0000-0000-0000000f7b01'::uuid);
  v_topup := public.create_topup(777);
  perform pg_temp.as_service();

  perform public.confirm_topup(v_topup.id, null, 777);

  select expires_at into v_exp from public.credit_ledger
   where player_id = '6f7b0000-0000-0000-0000-0000000f7b01' and delta_thb = 777;

  perform pg_temp.ok(
    v_exp = now() + make_interval(days => public.credit_validity_days()),
    'an ordinary top-up still lasts credit_validity_days()',
    coalesce(v_exp::text, 'no batch'));
end $$;

-- --- a mispaid pass is an ordinary top-up, with the ordinary expiry ----------

do $$
declare
  v_topup public.credit_topups;
  v_exp   timestamptz;
begin
  perform pg_temp.act_as('60000000-0000-0000-0000-0000000f7b01'::uuid);
  v_topup := public.begin_pass_purchase(20);
  perform pg_temp.as_service();

  perform public.confirm_topup(v_topup.id, null, 1400);

  select expires_at into v_exp from public.credit_ledger
   where player_id = '6f7b0000-0000-0000-0000-0000000f7b01' and reason = 'topup' and delta_thb = 1400
   order by expires_at limit 1;

  perform pg_temp.ok(
    v_exp = now() + make_interval(days => public.credit_validity_days()),
    'a 20-pass paid at the 5-pass price earns no 90-day validity',
    coalesce(v_exp::text, 'no batch'));
end $$;

select seq, label, case when passed then 'PASS' else 'FAIL' end as result, detail
from _results order by seq;

select count(*) as total,
       count(*) filter (where passed) as passed,
       count(*) filter (where not passed) as failed,
       case when count(*) filter (where not passed) = 0
            then 'ALL PASS' else 'HAS FAILURES' end as summary
from _results;

rollback;
