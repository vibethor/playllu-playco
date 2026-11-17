-- =============================================================================
-- PLAYCO — a venue's price is per hour; a game costs it times its length.
--
-- The owner, 17 Nov 2026: "the venue cost is given per hour, I just created a
-- 2h game and it's showing the cost of the venue only for 1h". Bangkok courts
-- are rented by the hour (CLAUDE.md, "Venue costs per hour"). HrajFotbal's
-- `game_pitch_cost_follow_venue` copied the venue's price as one flat amount
-- per game.
--
-- Now:
--   * `game_pitch_cost_for(venue, minutes)` = price × minutes ÷ 60, rounded to
--     whole baht; a game with no length is one hour, which is what the flat
--     price stood for;
--   * a game is costed that way when it is created, and recosted when its
--     venue OR its length changes — unless an admin set the cost by hand;
--   * clearing a hand-set cost (`set_game_pitch_cost(game, null)`) uses it too.
--
-- DATA: upcoming games whose cost came from their venue (not typed by an
-- admin) are recosted once, below, so the game the owner just created shows
-- its real cost. Played and cancelled games keep what they were recorded at.
--
-- Additive: two functions replaced with the same signatures, one new helper,
-- one trigger widened to a second column. No table changes.
-- Tests: supabase/tests/venue_cost_per_hour.sql, supabase/tests/pitch_costs.sql.
-- =============================================================================

create or replace function public.game_pitch_cost_for(p_venue_id uuid, p_duration_minutes integer)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select round(public.venue_pitch_cost_now(p_venue_id) * coalesce(p_duration_minutes, 60) / 60.0)::integer
$$;

revoke execute on function public.game_pitch_cost_for(uuid, integer) from public, anon, authenticated;

comment on function public.game_pitch_cost_for(uuid, integer) is
  'What a game at this venue and of this length costs if created now: the venue''s '
  'hourly price × minutes ÷ 60, rounded; no length counts as one hour (Playco, 17 Nov 2026).';

create or replace function public.game_pitch_cost_follow_venue()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cost integer;
begin
  if tg_op = 'UPDATE' then
    if new.venue_id is not distinct from old.venue_id
       and new.duration_minutes is not distinct from old.duration_minutes then
      return new;
    end if;
    if exists (select 1 from public.game_pitch_costs c
                where c.game_id = new.id and c.set_by_hand) then
      return new;
    end if;
    delete from public.game_pitch_costs c where c.game_id = new.id;
  end if;

  v_cost := public.game_pitch_cost_for(new.venue_id, new.duration_minutes);
  if v_cost is not null then
    insert into public.game_pitch_costs (game_id, cost_thb) values (new.id, v_cost)
    on conflict (game_id) do nothing;
  end if;
  return new;
end $$;

revoke execute on function public.game_pitch_cost_follow_venue() from public, anon, authenticated;

drop trigger if exists games_pitch_cost_on_venue_change on public.games;
create trigger games_pitch_cost_on_venue_change
  after update of venue_id, duration_minutes on public.games
  for each row execute function public.game_pitch_cost_follow_venue();

create or replace function public.set_game_pitch_cost(p_game_id uuid, p_cost_thb integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_venue    uuid;
  v_duration integer;
  v_cost     integer;
begin
  if not (public.is_admin_caller() or public.is_service_role()) then
    raise exception 'INSUFFICIENT_PERMISSION' using detail = 'admin only';
  end if;

  if p_cost_thb is not null and p_cost_thb not between 0 and public.pitch_cost_max_thb() then
    raise exception 'PITCH_COST_OUT_OF_RANGE'
      using detail = 'between 0 and ' || public.pitch_cost_max_thb()::text || ' THB';
  end if;

  select g.venue_id, g.duration_minutes into v_venue, v_duration
    from public.games g where g.id = p_game_id;
  if not found then
    raise exception 'GAME_NOT_FOUND';
  end if;

  -- An empty correction puts the game back on its venue's hourly price times
  -- its length — or on none, for a game with no venue.
  if p_cost_thb is null then
    delete from public.game_pitch_costs c where c.game_id = p_game_id;
    v_cost := public.game_pitch_cost_for(v_venue, v_duration);
    if v_cost is not null then
      insert into public.game_pitch_costs (game_id, cost_thb) values (p_game_id, v_cost);
    end if;
    return v_cost;
  end if;

  insert into public.game_pitch_costs (game_id, cost_thb, set_by_hand, updated_at)
  values (p_game_id, p_cost_thb, true, now())
  on conflict (game_id) do update
     set cost_thb = excluded.cost_thb,
         set_by_hand = true,
         updated_at = now();

  return p_cost_thb;
end $$;
revoke execute on function public.set_game_pitch_cost(uuid, integer) from public, anon;
grant execute on function public.set_game_pitch_cost(uuid, integer) to authenticated, service_role;

comment on function public.set_game_pitch_cost(uuid, integer) is
  'Admin-only. Corrects one game''s pitch cost; null puts it back on its venue''s '
  'hourly price × the game''s length (Playco, 17 Nov 2026).';

-- Upcoming games costed from their venue: recost once at price × length.
update public.game_pitch_costs c
   set cost_thb = public.game_pitch_cost_for(g.venue_id, g.duration_minutes),
       updated_at = now()
  from public.games g
 where g.id = c.game_id
   and not c.set_by_hand
   and g.venue_id is not null
   and g.starts_at > now()
   and g.status not in ('cancelled', 'played', 'settled')
   and public.game_pitch_cost_for(g.venue_id, g.duration_minutes) is not null;
