-- =============================================================================
-- WEEKLY GAMES — "Make this game recurring?" on the game form (Jachym, 18 Nov 2026)
--
-- CLAUDE.md §3 already names the rule: "repeats weekly" on the game form; following weeks are created and published
-- automatically. This is that rule.
--
-- THE SHAPE. A series is a chain: every copy points at the game it was copied from (`repeats_from`). The TIP of a
-- chain is the newest game with no copy of its own. `extend_weekly_games()` walks every tip that still has
-- `repeats_weekly` set and adds the next week — same venue, weekday, time, length, price, capacity, format, game type,
-- skill levels, language, notes and organiser — until the next occurrence is more than `p_horizon_days` away. So
-- next week's game is always on the 1-week list.
--
-- "UNTIL CHANGED OTHERWISE". Unticking on any game of a series turns it off for that game and every later copy, so
-- the chain stops growing. Cancelling one week (a holiday) does NOT stop the series: the cancelled game keeps its
-- flag and the week after is still made. A copy is made FROM THE TIP, so an edit to the newest game carries forward.
--
-- WHO RUNS IT. The admin's create/edit action calls it straight away (so next week appears at once), and the daily
-- cron `/api/cron/weekly-games` calls it with the service role.
--
-- Additive only: two nullable/defaulted columns, one partial unique index, two functions.
-- =============================================================================

alter table public.games
  add column if not exists repeats_weekly boolean not null default false;

alter table public.games
  add column if not exists repeats_from uuid references public.games (id) on delete set null;

-- One copy per game, ever: two sweeps racing cannot make the same week twice.
create unique index if not exists games_repeats_from_key
  on public.games (repeats_from)
  where repeats_from is not null;

comment on column public.games.repeats_weekly is
  'Make this game recurring: extend_weekly_games() creates and publishes the same game a week later.';
comment on column public.games.repeats_from is
  'The game this one was copied from by the weekly series. Null for a game made by hand.';

-- -----------------------------------------------------------------------------
-- extend_weekly_games — add the next week to every live series
-- -----------------------------------------------------------------------------
create or replace function public.extend_weekly_games(p_horizon_days integer default 8)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tip      public.games%rowtype;
  v_next     timestamptz;
  v_new_id   uuid;
  v_created  integer := 0;
  v_horizon  timestamptz := now() + make_interval(days => greatest(1, least(coalesce(p_horizon_days, 8), 28)));
  v_tz       text := public.app_timezone();
begin
  if not (public.is_admin_caller() or public.is_service_role()) then
    raise exception 'INSUFFICIENT_PERMISSION'
      using detail = 'extend_weekly_games requires an admin session or service role';
  end if;

  -- One sweep at a time; the partial unique index is the second line of defence.
  perform pg_advisory_xact_lock(hashtextextended('extend_weekly_games', 0));

  for v_tip in
    select g.*
      from public.games g
     where g.repeats_weekly
       and g.status <> 'draft'
       and not exists (select 1 from public.games n where n.repeats_from = g.id)
     order by g.starts_at
  loop
    loop
      -- A week later ON THE WALL CLOCK of the city, not 168 hours later.
      v_next := ((v_tip.starts_at at time zone v_tz) + interval '7 days') at time zone v_tz;

      -- A series switched back on after a gap does not back-fill past weeks.
      while v_next < now() loop
        v_next := ((v_next at time zone v_tz) + interval '7 days') at time zone v_tz;
      end loop;

      exit when v_next > v_horizon;

      -- An archived venue cannot take new games; the series simply stops growing.
      exit when v_tip.venue_id is null
        or exists (select 1 from public.venues v where v.id = v_tip.venue_id and v.archived_at is not null);

      insert into public.games (
        venue, venue_id, starts_at, capacity, price_thb, status, city, brand,
        format, surface, notes, duration_minutes, allowed_skill_levels, subs_per_team,
        meeting_point, pitch_name, language, repeats_weekly, repeats_from
      )
      values (
        v_tip.venue, v_tip.venue_id, v_next, v_tip.capacity, v_tip.price_thb, 'published', v_tip.city, v_tip.brand,
        v_tip.format, v_tip.surface, v_tip.notes, v_tip.duration_minutes, v_tip.allowed_skill_levels,
        v_tip.subs_per_team, v_tip.meeting_point, v_tip.pitch_name, v_tip.language, true, v_tip.id
      )
      returning id into v_new_id;

      insert into public.game_organizer_contacts (
        game_id, organizer_name, organizer_phone, organizer_telegram, organizer_player_id
      )
      select v_new_id, c.organizer_name, c.organizer_phone, c.organizer_telegram, c.organizer_player_id
        from public.game_organizer_contacts c
       where c.game_id = v_tip.id;

      insert into public.events (event_type, game_id, metadata, city, brand)
      values ('game_published', v_new_id,
              jsonb_build_object('capacity', v_tip.capacity, 'price_thb', v_tip.price_thb,
                                 'repeats_from', v_tip.id),
              v_tip.city, v_tip.brand);

      v_created := v_created + 1;

      select * into v_tip from public.games g where g.id = v_new_id;
    end loop;
  end loop;

  return v_created;
end;
$$;

revoke execute on function public.extend_weekly_games(integer) from public;
grant execute on function public.extend_weekly_games(integer) to authenticated, service_role;

comment on function public.extend_weekly_games(integer) is
  'Creates and publishes the next week of every recurring game until the next one is more than N days away.';

-- -----------------------------------------------------------------------------
-- set_game_repeats_weekly — tick or untick "Make this game recurring?"
--
-- Applies to the game AND every later copy in its chain: unticking stops the series wherever you untick it, and
-- ticking an older game re-arms the newest one, which is the one the sweep reads.
-- -----------------------------------------------------------------------------
create or replace function public.set_game_repeats_weekly(p_game_id uuid, p_repeats boolean)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_count integer;
begin
  if not (public.is_admin_caller() or public.is_service_role()) then
    raise exception 'INSUFFICIENT_PERMISSION'
      using detail = 'set_game_repeats_weekly requires an admin session or service role';
  end if;

  if not exists (select 1 from public.games g where g.id = p_game_id) then
    raise exception 'GAME_NOT_FOUND';
  end if;

  with recursive chain(id) as (
    select p_game_id
    union all
    select g.id from public.games g join chain c on g.repeats_from = c.id
  )
  update public.games g
     set repeats_weekly = coalesce(p_repeats, false)
    from chain
   where g.id = chain.id;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.set_game_repeats_weekly(uuid, boolean) from public;
grant execute on function public.set_game_repeats_weekly(uuid, boolean) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- VERIFICATION — shape only
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'games' and column_name = 'repeats_weekly')
     or not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'games' and column_name = 'repeats_from')
     or to_regprocedure('public.extend_weekly_games(integer)') is null
     or to_regprocedure('public.set_game_repeats_weekly(uuid, boolean)') is null then
    raise exception 'weekly games migration did not apply';
  end if;
end;
$$;
