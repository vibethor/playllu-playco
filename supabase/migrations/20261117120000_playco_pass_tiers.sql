-- =============================================================================
-- PLAYCO — game passes for Bangkok (Jachym, 16 Nov 2026).
--
--   5 games   1,150 THB   230 a game   saves 100
--   10 games  2,200 THB   220 a game   saves 300
--   20 games  4,000 THB   200 a game   saves 1,000
--
-- Decided with the prices: one credit pays for one spot in ANY game (the 300 THB beach and Sunday games too; that
-- is the existing "credits are seats" rule), credits from a pass expire 60 days after purchase (the existing
-- `credit_validity_days()`, applied to every top-up), and credits can pay for guests at one credit each.
--
-- WHAT THIS FILE CHANGES. Data only: the rows of `pass_tiers`. HrajFotbal's five Czech tiers (5/8/12/15/20 at
-- 840 ... 2,772, credited at 180 a seat) go; the three above come in, each credited at games x the seat price
-- (250), which is what `pass_tiers_credited_rule` requires. `expires_months` is no longer read by any code path
-- (round 40 moved every top-up to `credit_validity_days()`); it is set to 2 only so the column says roughly what
-- happens.
--
-- SAFE TO DELETE THE OLD TIERS: `credit_topups.pass_games` references this table, and on 16 Nov 2026 production
-- has no top-ups at all. The delete refuses, by name, if a purchase of an old tier ever exists.
--
-- Idempotent; verified at the foot. Phase 5 (price rules per city) replaces this table's single price list.
-- =============================================================================

do $$
begin
  if exists (select 1 from public.credit_topups where pass_games is not null and pass_games not in (5, 10, 20)) then
    raise exception 'playco passes: a purchase of an old tier exists; it must keep its tier row';
  end if;
end $$;

delete from public.pass_tiers where games not in (5, 10, 20);

insert into public.pass_tiers (games, price_thb, credited_thb, expires_months)
values
  (5,  1150, 5  * public.credit_seat_price_thb(), 2),
  (10, 2200, 10 * public.credit_seat_price_thb(), 2),
  (20, 4000, 20 * public.credit_seat_price_thb(), 2)
on conflict (games) do update
  set price_thb = excluded.price_thb,
      credited_thb = excluded.credited_thb,
      expires_months = excluded.expires_months;

do $$
begin
  if (select string_agg(games || ':' || price_thb, ',' order by games) from public.pass_tiers)
     <> '5:1150,10:2200,20:4000' then
    raise exception 'playco passes: the tiers are not 5/1150, 10/2200, 20/4000';
  end if;
  if exists (select 1 from public.pass_tiers
              where credited_thb <> games * public.credit_seat_price_thb()
                 or price_thb > credited_thb
                 or price_thb < public.manual_topup_min_thb()) then
    raise exception 'playco passes: a tier breaks the credited, discount or floor rule';
  end if;
end $$;
