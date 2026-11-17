-- =============================================================================
-- PLAYCO — referral codes (Jachym, 17 Nov 2026).
--
-- "When you create your profile you will be randomly generated a referral code that will be displayed in your
-- profile, you can copy to clipboard with one click, people can use this code in the account creation and then get
-- rewarded." The reward is not decided yet (TODO.md), so this only records who referred whom.
--
--   players.referral_code  6 random characters from an alphabet without 0/O and 1/I/L (his choice: random, not
--                          name-based). Unique. Given on insert by a trigger; every existing player gets one here.
--   players.referred_by    the player whose code was entered at sign-up; set once, never replaced; never yourself.
--   players.referred_at    when it was recorded.
--
-- Two RPCs:
--   referral_code_exists(code)  for the sign-up form, before the account exists (anon may call it; codes are not
--                               secrets and a lookup reveals nothing else).
--   record_my_referrer(code)    for the new player's own session, after complete_signup_v2. An unknown code, your
--                               own code, or a second code is ignored (returns false), as Phase 10 of the plan says.
--
-- Additive: new columns, a trigger, three functions. Players still cannot write any of these columns themselves
-- (UPDATE on players is granted column by column, and these are not granted). Idempotent; verified at the foot.
-- =============================================================================

alter table public.players add column if not exists referral_code text;
alter table public.players add column if not exists referred_by uuid references public.players (id) on delete set null;
alter table public.players add column if not exists referred_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'players_referral_code_shape') then
    alter table public.players add constraint players_referral_code_shape
      check (referral_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'players_not_own_referrer') then
    alter table public.players add constraint players_not_own_referrer check (referred_by is distinct from id);
  end if;
end $$;

create unique index if not exists players_referral_code_key on public.players (referral_code);

comment on column public.players.referral_code is
  'Six random characters (no 0/O, 1/I/L), unique, given on insert. Shown on the profile; entered by friends at sign-up.';
comment on column public.players.referred_by is
  'The player whose referral code was entered at sign-up. Set once by record_my_referrer; never the player themselves.';

-- The event log only takes catalogued types; add 'referral_recorded' (read the live list, add, rebuild, as
-- 20261102100000_organizer_player.sql does; both spellings of the array are parsed).
do $$
declare
  v_def   text;
  v_types text[];
begin
  select pg_get_constraintdef(c.oid) into v_def
    from pg_constraint c
   where c.conrelid = 'public.events'::regclass and c.conname = 'events_event_type_catalog';
  if v_def is null then
    raise exception 'referral codes: events_event_type_catalog is missing';
  end if;

  select array_agg(distinct parsed.x) into v_types
    from (
      select m[1] as x from regexp_matches(v_def, '''([a-z_]+)''', 'g') as m
      union
      select btrim(y) from regexp_matches(v_def, '\{([^}]*)\}', 'g') as b, unnest(string_to_array(b[1], ',')) as y
    ) parsed
   where parsed.x <> '';

  if coalesce(array_length(v_types, 1), 0) < 30 or not ('booking_created' = any (v_types)) then
    raise exception 'referral codes: could not read the event catalog (% types)', coalesce(array_length(v_types, 1), 0);
  end if;

  if 'referral_recorded' = any (v_types) then
    return;
  end if;

  v_types := array(select distinct unnest(v_types || array['referral_recorded']));
  alter table public.events drop constraint events_event_type_catalog;
  execute format(
    'alter table public.events add constraint events_event_type_catalog check (event_type in (%s))',
    (select string_agg(quote_literal(t.x), ', ' order by t.x) from unnest(v_types) as t(x))
  );
end $$;

-- A fresh code that no player holds. random() is enough: a code is a label, not a secret.
create or replace function public.new_referral_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_length   constant integer := 6;
  v_code     text;
begin
  loop
    select string_agg(substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::integer, 1), '')
      into v_code
      from generate_series(1, v_length);
    exit when not exists (select 1 from public.players p where p.referral_code = v_code);
  end loop;
  return v_code;
end;
$$;

revoke all on function public.new_referral_code() from public, anon, authenticated;

create or replace function public.players_assign_referral_code()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.referral_code is null then
    new.referral_code := public.new_referral_code();
  end if;
  return new;
end;
$$;

drop trigger if exists players_assign_referral_code on public.players;
create trigger players_assign_referral_code
  before insert on public.players
  for each row execute function public.players_assign_referral_code();

-- Every existing player, one statement each, so each new code sees the ones before it.
do $$
declare
  v_id uuid;
begin
  for v_id in select id from public.players where referral_code is null loop
    update public.players set referral_code = public.new_referral_code() where id = v_id;
  end loop;
end $$;

alter table public.players alter column referral_code set not null;

create or replace function public.referral_code_exists(p_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.players p
     where p.referral_code = upper(regexp_replace(coalesce(p_code, ''), '[\s-]', '', 'g'))
       and p.deleted_at is null
  );
$$;

revoke all on function public.referral_code_exists(text) from public;
grant execute on function public.referral_code_exists(text) to anon, authenticated;

create or replace function public.record_my_referrer(p_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me       public.players%rowtype;
  v_referrer public.players%rowtype;
  v_code     text := upper(regexp_replace(coalesce(p_code, ''), '[\s-]', '', 'g'));
begin
  select * into v_me from public.players p where p.auth_user_id = auth.uid();
  if not found or v_me.referred_by is not null or v_code = '' then
    return false;
  end if;

  select * into v_referrer from public.players p
   where p.referral_code = v_code and p.deleted_at is null;
  if not found or v_referrer.id = v_me.id then
    return false;
  end if;

  update public.players
     set referred_by = v_referrer.id,
         referred_at = now()
   where id = v_me.id;

  insert into public.events (event_type, player_id, metadata)
  values ('referral_recorded', v_me.id, jsonb_build_object('referrer_id', v_referrer.id, 'code', v_code));

  return true;
end;
$$;

revoke all on function public.record_my_referrer(text) from public, anon;
grant execute on function public.record_my_referrer(text) to authenticated;

do $$
begin
  if exists (select 1 from public.players where referral_code is null) then
    raise exception 'referral codes: a player has no code';
  end if;
  if has_function_privilege('anon', 'public.record_my_referrer(text)', 'execute') then
    raise exception 'referral codes: anon can record a referrer';
  end if;
  if has_column_privilege('authenticated', 'public.players', 'referred_by', 'UPDATE') then
    raise exception 'referral codes: a player could set their own referrer directly';
  end if;
end $$;
