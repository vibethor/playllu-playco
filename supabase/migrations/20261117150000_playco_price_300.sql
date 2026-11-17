-- =============================================================================
-- PLAYCO — 300 THB for every game (Jachym, 17 Nov 2026: "we will adjust prices to 300 thb for every game so please
-- make game pass prices adjusted based on that as well").
--
-- 1. credit_seat_price_thb() = 300: one credit is one 300 THB seat.
-- 2. price_for_duration() prefills 300 for every length (the long-game surcharge had already made longer games 300).
-- 3. The passes keep the discounts approved on 16 Nov (8%, 12%, 20%), now on 300:
--      5 games   1,380 THB  (276 a game)
--      10 games  2,640 THB  (264 a game)
--      20 games  4,800 THB  (240 a game)
--    credited at games x 300, which pass_tiers_credited_rule requires (it reads credit_seat_price_thb(), so the
--    function changes first and the rows straight after, in this one transaction).
-- 4. Upcoming games priced 250 become 300. Bookings already made keep the price they were made at.
--
-- NOT CHANGED: credit balances are stored in baht, so an existing balance buys fewer 300 THB seats than 250 THB ones.
-- On 17 Nov the only balance is the owner's own test credit (2,500 THB, shown as 10 credits, now 8 + 100 THB).
--
-- Idempotent; verified at the foot.
-- =============================================================================

create or replace function public.credit_seat_price_thb()
returns integer
language sql
immutable
set search_path = ''
as $$ select 300 $$;

comment on function public.credit_seat_price_thb() is
  'What one credit buys: one seat. Playco: 300 THB, every Bangkok game (17 Nov 2026; was 250). Mirrored by '
  'PASS_REFERENCE_PRICE_THB in lib/pass/creditPrice.ts. Phase 5 replaces flat seat prices with price rules.';

create or replace function public.price_for_duration(p_minutes integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select public.credit_seat_price_thb()
$$;

comment on function public.price_for_duration(integer) is
  'What the admin form PREFILLS as a price: 300 THB for a game of any length (Playco, 17 Nov 2026). A default, not a '
  'law. Mirrored by priceForDurationThb in lib/games/price.ts.';

update public.pass_tiers set price_thb = 1380, credited_thb = 5  * public.credit_seat_price_thb() where games = 5;
update public.pass_tiers set price_thb = 2640, credited_thb = 10 * public.credit_seat_price_thb() where games = 10;
update public.pass_tiers set price_thb = 4800, credited_thb = 20 * public.credit_seat_price_thb() where games = 20;

update public.games
   set price_thb = public.credit_seat_price_thb()
 where price_thb = 250
   and starts_at > now()
   and status in ('draft', 'published', 'full');

do $$
begin
  if public.credit_seat_price_thb() <> 300 or public.price_for_duration(180) <> 300 or public.price_for_duration(60) <> 300 then
    raise exception 'price 300: the seat price or the prefill is not 300';
  end if;
  if (select string_agg(games || ':' || price_thb || ':' || credited_thb, ',' order by games) from public.pass_tiers)
     <> '5:1380:1500,10:2640:3000,20:4800:6000' then
    raise exception 'price 300: the passes are not 1,380 / 2,640 / 4,800 credited at 300 a game';
  end if;
  if exists (select 1 from public.games where price_thb = 250 and starts_at > now() and status in ('draft', 'published', 'full')) then
    raise exception 'price 300: an upcoming game still costs 250';
  end if;
end $$;
