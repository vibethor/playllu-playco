-- =============================================================================
-- PLAYCO — an admin adds a player to an upcoming game, free (Jachym, 17 Nov 2026).
--
-- "Make it in the admin panel that I can ... add them to an upcoming game." The spot is FREE, like a staff seat
-- (his answer to "how is the spot paid?"): confirmed at once, price 0, nothing taken from the wallet, marked
-- booked_by_admin, and an admin_booking_created event names the admin.
--
-- WHY A NEW FUNCTION. admin_create_booking only takes qr or cash: it derives credit or seed_free itself and refuses
-- either as an input, and seed_free is reserved for seed players. A free admin spot is a different outcome, so it
-- gets its own entry point instead of widening that one. It still records payment_method = 'seed_free', which the
-- app already shows as "Free" (lib/booking/badges.ts, the admin seat grid); is_seed stays false, so seed players
-- and admin comps stay distinguishable (booked_by_admin + the event).
--
-- THE SAME RULES AS ANY BOOKING. Same locks (player first, then game), same refusals with the same codes
-- (GAME_NOT_BOOKABLE, GAME_ALREADY_STARTED, DUPLICATE_ACTIVE_BOOKING, CAPACITY_FULL), and sync_game_fullness at the
-- end, so the last seat marks the game full exactly as a paid booking does. One seat, no guests.
--
-- Additive: a new function, granted to authenticated only; authorization is inside it. Verified at the foot.
-- =============================================================================

create or replace function public.admin_add_free_seat(p_game_id uuid, p_player_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id   uuid;
  v_player     public.players%rowtype;
  v_game       public.games%rowtype;
  v_taken      integer;
  v_booking_id uuid;
begin
  if not public.is_admin_caller() then
    raise exception 'INSUFFICIENT_PERMISSION'
      using detail = 'admin_add_free_seat requires an admin session';
  end if;
  v_admin_id := public.current_player_id();

  -- === LOCK ORDER: PLAYER FIRST, THEN GAME (as create_booking_internal). ===
  perform pg_advisory_xact_lock(hashtextextended(p_player_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended(p_game_id::text, 0));

  select * into v_player from public.players p where p.id = p_player_id;
  if not found or v_player.deleted_at is not null then
    raise exception 'PLAYER_NOT_FOUND';
  end if;

  select * into v_game from public.games g where g.id = p_game_id;
  if not found then
    raise exception 'GAME_NOT_FOUND';
  end if;

  if v_game.status not in ('published', 'full') then
    raise exception 'GAME_NOT_BOOKABLE'
      using detail = 'game status is ' || v_game.status::text;
  end if;

  if v_game.starts_at <= now() then
    raise exception 'GAME_ALREADY_STARTED';
  end if;

  if exists (
    select 1 from public.bookings b
     where b.game_id = p_game_id
       and b.player_id = p_player_id
       and b.status in ('reserved', 'confirmed')
  ) then
    raise exception 'DUPLICATE_ACTIVE_BOOKING';
  end if;

  v_taken := public.game_seats_taken(p_game_id);
  if v_taken + 1 > v_game.capacity then
    raise exception 'CAPACITY_FULL'
      using detail = 'seats taken ' || v_taken::text || ', capacity ' || v_game.capacity::text;
  end if;

  insert into public.bookings (
    game_id, player_id, status, payment_method, payment_code,
    price_thb, credit_applied_thb, is_seed, booked_by_admin, guest_count, payment_pending_at
  ) values (
    p_game_id, p_player_id, 'confirmed', 'seed_free', null,
    0, 0, false, true, 0, null
  ) returning id into v_booking_id;

  insert into public.events (event_type, player_id, game_id, booking_id, metadata, city, brand)
  values ('booking_created', p_player_id, p_game_id, v_booking_id,
          jsonb_build_object('payment_method', 'seed_free', 'price_thb', 0, 'credit_applied_thb', 0,
                             'amount_due_thb', 0, 'guest_count', 0, 'seats', 1,
                             'awaiting_online_payment', false, 'booked_by_admin', true, 'free', true),
          v_game.city, v_game.brand);

  insert into public.events (event_type, player_id, game_id, booking_id, metadata, city, brand)
  values ('admin_booking_created', p_player_id, p_game_id, v_booking_id,
          jsonb_build_object('payment_method', 'seed_free', 'free', true,
                             'acting_admin_player_id', v_admin_id, 'via_service_role', false),
          v_game.city, v_game.brand);

  perform public.sync_game_fullness(p_game_id);

  return v_booking_id;
end;
$$;

comment on function public.admin_add_free_seat(uuid, uuid) is
  'Admin only: add a player to an upcoming published game as a free, confirmed spot (booked_by_admin). '
  'Same refusals as a booking; marks the game full when the last seat goes.';

revoke all on function public.admin_add_free_seat(uuid, uuid) from public, anon;
grant execute on function public.admin_add_free_seat(uuid, uuid) to authenticated;

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'admin_add_free_seat' and p.prosecdef) then
    raise exception 'admin free seat: the function is missing or not SECURITY DEFINER';
  end if;
  if has_function_privilege('anon', 'public.admin_add_free_seat(uuid, uuid)', 'execute') then
    raise exception 'admin free seat: anon can call it';
  end if;
end $$;
