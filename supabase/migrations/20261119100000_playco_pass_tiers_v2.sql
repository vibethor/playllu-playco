-- =============================================================================
-- PLAYCO — game passes v2 (Jachym, 19 Nov 2026: "more packs and better discounts", after player feedback that the
-- expiry and the options were not good enough).
--
--   5 games   1,400 THB   280 a game    7% off   valid 30 days
--   8 games   2,080 THB   260 a game   13% off   valid 45 days
--   12 games  2,880 THB   240 a game   20% off   valid 60 days
--   20 games  4,400 THB   220 a game   27% off   valid 90 days
--
-- Replaces 5 / 10 / 20 for 1,380 / 2,640 / 4,800, all valid 60 days.
--
-- WHAT THIS FILE CHANGES.
--   1. `pass_tiers.validity_days` (additive): how long a pass's credits last, per tier.
--   2. `confirm_topup`: an honoured pass (tier chosen AND paid at exactly its price) dates its credit batch from the
--      tier's `validity_days`. Every other top-up keeps `credit_validity_days()`, as since round 40. Cancelling a game
--      paid from a pass already returns the credit to the batch it came from, so it keeps the pass's expiry.
--   3. The rows: 5 and 20 are repriced, 8 and 12 come in, 10 goes. `credited_thb` stays games x the seat price (300),
--      which `pass_tiers_credited_rule` requires.
--
-- SAFE TO DELETE THE 10-GAME TIER: on 19 Nov 2026 production holds two pending 5-pass top-ups and nothing else. The
-- delete refuses, by name, if a purchase of the 10-game pass exists.
--
-- STRIPE NEEDS NOTHING. The amount Stripe charges is `credit_topups.amount_thb`, stamped from `pass_tiers` by
-- `begin_pass_purchase`; there are no per-tier Stripe prices.
--
-- Idempotent; verified at the foot.
-- =============================================================================

-- 1. ---------------------------------------------------------------------------
alter table public.pass_tiers add column if not exists validity_days integer;

alter table public.pass_tiers drop constraint if exists pass_tiers_validity_range;
alter table public.pass_tiers add constraint pass_tiers_validity_range
  check (validity_days is null or validity_days between 1 and 365);

comment on column public.pass_tiers.validity_days is
  'Days a pass''s credits stay valid from purchase (Playco, 19 Nov 2026). Read by confirm_topup; null falls back to '
  'credit_validity_days(). Mirrored on the pass page through lib/pass/queries.ts.';

-- 2. ---------------------------------------------------------------------------
do $$
declare
  v_def text;
  v_old text := '      -- ROUND 40: the tier no longer sets the expiry; see the declaration.'
    || chr(10) || '      null;';
  v_new text := '      -- PLAYCO (19 Nov 2026): an honoured pass lasts its own tier''s validity.'
    || chr(10) || '      v_expires_at := now() + make_interval(days => coalesce(v_tier.validity_days,'
    || chr(10) || '                                                              public.credit_validity_days()));';
begin
  select pg_get_functiondef(p.oid) into v_def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'confirm_topup';

  if v_def is null then
    raise exception 'passes v2: confirm_topup is missing';
  elsif position('v_tier.validity_days' in v_def) > 0 then
    raise notice 'passes v2: confirm_topup already reads the tier validity';
  elsif position(v_old in v_def) = 0 then
    raise exception 'passes v2: confirm_topup does not carry the round 40 expiry line';
  else
    execute replace(v_def, v_old, v_new);
  end if;
end $$;

-- 3. ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from public.credit_topups where pass_games is not null and pass_games not in (5, 8, 12, 20)) then
    raise exception 'passes v2: a purchase of a retired tier exists; it must keep its tier row';
  end if;
end $$;

delete from public.pass_tiers where games not in (5, 8, 12, 20);

insert into public.pass_tiers (games, price_thb, credited_thb, expires_months, validity_days)
values
  (5,  1400, 5  * public.credit_seat_price_thb(), 1, 30),
  (8,  2080, 8  * public.credit_seat_price_thb(), 2, 45),
  (12, 2880, 12 * public.credit_seat_price_thb(), 2, 60),
  (20, 4400, 20 * public.credit_seat_price_thb(), 3, 90)
on conflict (games) do update
  set price_thb = excluded.price_thb,
      credited_thb = excluded.credited_thb,
      expires_months = excluded.expires_months,
      validity_days = excluded.validity_days;

-- 4. VERIFICATION ----------------------------------------------------------------
do $$
begin
  if (select string_agg(games || ':' || price_thb || ':' || validity_days, ',' order by games) from public.pass_tiers)
     <> '5:1400:30,8:2080:45,12:2880:60,20:4400:90' then
    raise exception 'passes v2: the tiers are not 5/1400/30, 8/2080/45, 12/2880/60, 20/4400/90';
  end if;
  if exists (select 1 from public.pass_tiers
              where credited_thb <> games * public.credit_seat_price_thb()
                 or price_thb > credited_thb
                 or price_thb < public.manual_topup_min_thb()) then
    raise exception 'passes v2: a tier breaks the credited, discount or floor rule';
  end if;
  if (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = 'confirm_topup') not like '%v_tier.validity_days%' then
    raise exception 'passes v2: confirm_topup does not read the tier validity';
  end if;
end $$;
