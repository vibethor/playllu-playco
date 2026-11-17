-- =============================================================================
-- Referral codes (Jachym, 17 Nov 2026)
--
-- Run:  node supabase/tests/run.mjs referral_codes
--
-- "When you create your profile you will be randomly generated a referral code that will be displayed in your
-- profile ... people can use this code in the account creation." 6 random characters (his choice), no reward yet.
-- Plan, Phase 10: a valid code stores the referrer; an invalid code is ignored; a player cannot refer themselves.
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

create function pg_temp.record(p_uid uuid, p_code text)
returns boolean language plpgsql as $$
declare v boolean;
begin
  perform pg_temp.act_as(p_uid);
  v := public.record_my_referrer(p_code);
  perform set_config('role', 'postgres', true);
  return v;
end $$;

-- --- fixtures ----------------------------------------------------------------

insert into auth.users (id, email) values
  ('c0000000-0000-0000-0000-0000000ef001'::uuid, 'ref-alice@test.invalid'),
  ('c0000000-0000-0000-0000-0000000ef002'::uuid, 'ref-bob@test.invalid'),
  ('c0000000-0000-0000-0000-0000000ef003'::uuid, 'ref-carol@test.invalid');

insert into public.players (id, nickname, email, auth_user_id) values
  ('cf000000-0000-0000-0000-0000000ef001'::uuid, 'RefAlice', 'ref-alice@test.invalid', 'c0000000-0000-0000-0000-0000000ef001'::uuid),
  ('cf000000-0000-0000-0000-0000000ef002'::uuid, 'RefBob', 'ref-bob@test.invalid', 'c0000000-0000-0000-0000-0000000ef002'::uuid),
  ('cf000000-0000-0000-0000-0000000ef003'::uuid, 'RefCarol', 'ref-carol@test.invalid', 'c0000000-0000-0000-0000-0000000ef003'::uuid);

-- =============================================================================
-- EVERY PLAYER HAS A CODE
-- =============================================================================

select pg_temp.ok(
  (select bool_and(referral_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$') from public.players
    where id in ('cf000000-0000-0000-0000-0000000ef001', 'cf000000-0000-0000-0000-0000000ef002',
                 'cf000000-0000-0000-0000-0000000ef003')),
  'a new player gets a code of six characters, with no 0/O, 1/I/L');

select pg_temp.ok(
  (select count(*) = 0 from public.players where referral_code is null),
  'no player is left without a code (existing players were given one)');

select pg_temp.ok(
  (select count(distinct referral_code) = count(*) from public.players),
  'codes are unique');

-- =============================================================================
-- LOOKING A CODE UP (the sign-up form checks before creating the account)
-- =============================================================================

select pg_temp.ok(
  public.referral_code_exists((select referral_code from public.players where id = 'cf000000-0000-0000-0000-0000000ef001')),
  'an existing code is found');

select pg_temp.ok(
  public.referral_code_exists(lower(' ' || (select referral_code from public.players where id = 'cf000000-0000-0000-0000-0000000ef001') || ' ')),
  'lowercase and stray spaces still find it');

select pg_temp.ok(not public.referral_code_exists('ZZZZZZ'), 'an unknown code is not found');

select pg_temp.ok(
  has_function_privilege('anon', 'public.referral_code_exists(text)', 'execute'),
  'a visitor who is not signed up yet can check a code');

-- =============================================================================
-- RECORDING THE REFERRER
-- =============================================================================

select pg_temp.ok(
  pg_temp.record('c0000000-0000-0000-0000-0000000ef002',
                 (select referral_code from public.players where id = 'cf000000-0000-0000-0000-0000000ef001')),
  'a valid code records the referrer');

select pg_temp.ok(
  (select referred_by = 'cf000000-0000-0000-0000-0000000ef001' and referred_at is not null
     from public.players where id = 'cf000000-0000-0000-0000-0000000ef002'),
  'the new player now points at who referred them');

select pg_temp.ok(
  (select count(*) = 1 from public.events
    where event_type = 'referral_recorded' and player_id = 'cf000000-0000-0000-0000-0000000ef002'
      and metadata ->> 'referrer_id' = 'cf000000-0000-0000-0000-0000000ef001'),
  'the referral is in the event log, ready for a reward rule later');

select pg_temp.ok(
  not pg_temp.record('c0000000-0000-0000-0000-0000000ef002',
                     (select referral_code from public.players where id = 'cf000000-0000-0000-0000-0000000ef003')),
  'a second code does not replace the first referrer');

select pg_temp.ok(
  (select referred_by = 'cf000000-0000-0000-0000-0000000ef001' from public.players
    where id = 'cf000000-0000-0000-0000-0000000ef002'),
  'and the first referrer is kept');

select pg_temp.ok(
  not pg_temp.record('c0000000-0000-0000-0000-0000000ef003', 'ZZZZZZ')
  and (select referred_by is null from public.players where id = 'cf000000-0000-0000-0000-0000000ef003'),
  'an unknown code is ignored');

select pg_temp.ok(
  not pg_temp.record('c0000000-0000-0000-0000-0000000ef003',
                     (select referral_code from public.players where id = 'cf000000-0000-0000-0000-0000000ef003'))
  and (select referred_by is null from public.players where id = 'cf000000-0000-0000-0000-0000000ef003'),
  'a player cannot refer themselves');

select pg_temp.ok(
  not has_function_privilege('anon', 'public.record_my_referrer(text)', 'execute'),
  'only a signed-in player can record a referrer, and only for themselves');

select seq, label, case when passed then 'PASS' else 'FAIL' end as result, detail
from _results order by seq;

select count(*) as total,
       count(*) filter (where passed) as passed,
       count(*) filter (where not passed) as failed,
       case when count(*) filter (where not passed) = 0
            then 'ALL PASS' else 'HAS FAILURES' end as summary
from _results;

rollback;
