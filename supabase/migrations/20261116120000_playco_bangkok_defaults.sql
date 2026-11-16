-- =============================================================================
-- PLAYCO, PHASE F — Bangkok as the default city, Bangkok time, Bangkok prices.
--
-- The fast-track preview (docs/EXECUTION_PLAN.md, Phase F) runs the inherited HrajFotbal schema for one city before
-- cities exist as rows. Phase 2 replaces every literal below with the city row; until then this file is the one
-- place the database names a place.
--
-- 1. `app_timezone()` — the time zone every SQL-formatted datetime uses. Functions that said 'Europe/Prague' are
--    restated to call it, by rewriting their installed definition (the inherited pattern: read what is installed,
--    replace, raise if the text is not what was expected). CREATE OR REPLACE keeps each function's grants.
-- 2. Event and row stamps: 'prague' → 'bangkok', 'hrajfotbal' → 'playco', in column defaults and in the functions
--    that stamp them.
-- 3. Prices: one seat (the wallet's credit nominal) is 250 THB; the form's prefill is 250 up to two hours and 300
--    above (the 3-hour Sunday game). The organiser can still type any price — beach games are 300.
--
-- Additive in effect, idempotent, safe on an empty database. Verified at the foot.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. The time zone
-- -----------------------------------------------------------------------------

create or replace function public.app_timezone()
returns text
language sql
immutable
set search_path = ''
as $$ select 'Asia/Bangkok'::text $$;

revoke execute on function public.app_timezone() from public;
grant execute on function public.app_timezone() to anon, authenticated, service_role;

comment on function public.app_timezone() is
  'The IANA time zone SQL formats datetimes in. Mirrors lib/city/default.ts. Phase 2 replaces it with the city row.';

-- -----------------------------------------------------------------------------
-- 2. Functions that name Prague, rewritten in place
-- -----------------------------------------------------------------------------

do $$
declare
  f record;
  v_def text;
  v_new text;
begin
  for f in
    select p.oid, p.proname
      from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and p.prokind = 'f'
       and (p.prosrc like '%''Europe/Prague''%' or p.prosrc like '%''prague''%' or p.prosrc like '%''hrajfotbal''%')
  loop
    v_def := pg_get_functiondef(f.oid);
    v_new := replace(v_def, '''Europe/Prague''', 'public.app_timezone()');
    v_new := replace(v_new, '''prague''', '''bangkok''');
    v_new := replace(v_new, '''hrajfotbal''', '''playco''');
    if v_new = v_def then
      raise exception 'bangkok defaults: % matched but nothing was replaced', f.proname;
    end if;
    execute v_new;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Column defaults
-- -----------------------------------------------------------------------------

do $$
declare
  c record;
begin
  for c in
    select table_name, column_name, column_default
      from information_schema.columns
     where table_schema = 'public'
       and column_default in ('''prague''::text', '''hrajfotbal''::text')
  loop
    execute format(
      'alter table public.%I alter column %I set default %L',
      c.table_name, c.column_name,
      case when c.column_default = '''prague''::text' then 'bangkok' else 'playco' end
    );
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Prices
-- -----------------------------------------------------------------------------

create or replace function public.credit_seat_price_thb()
returns integer
language sql
immutable
set search_path = ''
as $$ select 250 $$;

comment on function public.credit_seat_price_thb() is
  'What one credit buys: one seat. Playco, Phase F: 250 THB, a standard Bangkok volleyball game. Mirrored by '
  'PASS_REFERENCE_PRICE_THB in lib/pass/creditPrice.ts. Phase 5 replaces flat seat prices with price rules.';

create or replace function public.price_for_duration(p_minutes integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case when p_minutes is not null and p_minutes > 120 then 300 else public.credit_seat_price_thb() end
$$;

comment on function public.price_for_duration(integer) is
  'What the admin form PREFILLS as a price: 250 THB up to two hours, 300 above (the 3-hour Sunday game). A default, '
  'not a law — the organiser types the price. Mirrored by priceForDurationThb in lib/games/price.ts.';

-- -----------------------------------------------------------------------------
-- 5. Verification
-- -----------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1 from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and (p.prosrc like '%''Europe/Prague''%' or p.prosrc like '%''prague''%' or p.prosrc like '%''hrajfotbal''%')
  ) then
    raise exception 'bangkok defaults: a function still names Prague or HrajFotbal';
  end if;

  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and column_default in ('''prague''::text', '''hrajfotbal''::text')
  ) then
    raise exception 'bangkok defaults: a column still defaults to Prague or HrajFotbal';
  end if;

  if public.credit_seat_price_thb() <> 250
     or public.price_for_duration(120) <> 250
     or public.price_for_duration(180) <> 300 then
    raise exception 'bangkok defaults: prices are not 250 / 300';
  end if;
end $$;
