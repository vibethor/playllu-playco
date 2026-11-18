-- =============================================================================
-- THE PROMPTPAY DOUBLE PAYMENT (Phase F check 7b, open since 16 Nov 2026; fixed 18 Nov 2026)
--
-- A player who already holds a spot can open a second booking form while the first payment is still settling
-- (PromptPay confirms later than a card) and pay again. `settle_checkout_session` inserted a second booking, hit the
-- one-active-booking-per-player index (`bookings_one_active_per_player_per_game`) and raised. The webhook then fell
-- through to the legacy `confirm_online_purchase`, which answered "unknown": Stripe kept the money, the checkout stayed
-- `open`, and the player got nothing.
--
-- Now such a payment ends like a payment for a game that filled: the full amount is credited to the player's wallet,
-- the checkout is closed as `credited` and flagged for attention with the reason, and the player is told they already
-- had a spot. A unique violation on the insert takes the same path, so no future race can end as an error.
--
-- Same signature, so `create or replace`; grants are unchanged. Additive: no table or column changes.
-- Test: supabase/tests/settle_already_booked.sql
-- =============================================================================

create or replace function public.settle_checkout_session(p_stripe_session_id text, p_amount_thb integer)
returns text
language plpgsql
security definer
set search_path = ''
as $function$

declare
  v_session public.checkout_sessions%rowtype;
  v_game    public.games%rowtype;
  v_target  public.bookings%rowtype;
  v_seats   integer;
  v_wanted  integer;
  v_booking uuid;
  v_already_in boolean := false;
begin
  if not (public.is_admin_caller() or public.is_service_role()) then
    raise exception 'INSUFFICIENT_PERMISSION'
      using detail = 'settle_checkout_session is called by the webhook';
  end if;

  select * into v_session
    from public.checkout_sessions
   where stripe_session_id = p_stripe_session_id;

  if not found then
    return 'unknown';
  end if;

  if v_session.status <> 'open' then
    return 'already';
  end if;

  -- === LOCK ORDER: PLAYER FIRST, THEN GAME. Same as `cancel_booking`. ===
  perform pg_advisory_xact_lock(hashtextextended(v_session.player_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended(v_session.game_id::text, 0));

  select * into v_session
    from public.checkout_sessions where id = v_session.id;
  if v_session.status <> 'open' then
    return 'already';
  end if;

  select * into v_game from public.games g where g.id = v_session.game_id;

  /*
   * ALREADY IN (18 Nov 2026, the PromptPay double payment). A player can open a second booking form while the first
   * payment is still settling — PromptPay confirms later than a card — and pay twice. The second payment cannot become
   * a second booking (one active booking per player per game), so it becomes credit, in full, below.
   */
  if v_session.kind = 'booking' then
    v_already_in := exists (
      select 1 from public.bookings b
       where b.game_id = v_session.game_id
         and b.player_id = v_session.player_id
         and b.status in ('reserved', 'confirmed'));
  end if;

  /*
   * HOW MANY SEATS THIS PAYMENT IS ASKING FOR, and it is the ONE place the two
   * kinds differ arithmetically: a booking wants the player plus their guests;
   * an add-guest payment wants only the guests, because the player is already
   * counted by the booking being extended.
   */
  v_wanted := case when v_session.kind = 'add_guests'
                   then v_session.guest_count
                   else 1 + v_session.guest_count end;
  v_seats  := public.game_seats_taken(v_session.game_id);

  if not v_already_in
     and v_game.status in ('published', 'full')
     and v_seats + v_wanted <= v_game.capacity then

    if v_session.kind = 'add_guests' then
      select * into v_target
        from public.bookings b where b.id = v_session.target_booking_id;

      /*
       * THE BOOKING MUST STILL BE THERE AND STILL BE PAID. Somebody can cancel
       * between opening the form and paying — rare, but the money has already
       * moved by the time we find out, so it takes the credit path rather than
       * an error. Extending a cancelled booking would put guests on the roster
       * belonging to a player who is not coming.
       */
      if found and v_target.status = 'confirmed' then
        update public.bookings
           set guest_count = guest_count + v_session.guest_count,
               price_thb   = price_thb + p_amount_thb
         where id = v_target.id;

        insert into public.events (event_type, player_id, game_id, booking_id, metadata, city, brand)
        values ('booking_guests_added', v_session.player_id, v_session.game_id,
                v_target.id,
                jsonb_build_object('added', v_session.guest_count,
                                   'paid_thb', p_amount_thb, 'rail', 'checkout'),
                v_game.city, v_game.brand);

        insert into public.events (event_type, player_id, game_id, booking_id, metadata, city, brand)
        values ('payment_confirmed', v_session.player_id, v_session.game_id,
                v_target.id,
                jsonb_build_object('amount_thb', p_amount_thb,
                                   'session', p_stripe_session_id),
                v_game.city, v_game.brand);

        update public.checkout_sessions
           set status = 'booked', booking_id = v_target.id, settled_at = now()
         where id = v_session.id;

        perform public.sync_game_fullness(v_session.game_id);
        return 'booked';
      end if;

    else
      /*
       * BELT AND BRACES: the check above runs under the player's lock, but any other path that slips a booking in
       * first must still end as credit, never as an error the webhook cannot settle.
       */
      begin
        insert into public.bookings
               (game_id, player_id, status, payment_method, price_thb,
                credit_applied_thb, guest_count, stripe_session_id)
             values (v_session.game_id, v_session.player_id, 'confirmed', 'qr',
                     v_session.amount_thb, 0, v_session.guest_count,
                     p_stripe_session_id)
          returning id into v_booking;
      exception when unique_violation then
        v_already_in := true;
      end;
    end if;

    if not v_already_in and v_session.kind <> 'add_guests' then

      insert into public.events (event_type, player_id, game_id, booking_id, metadata, city, brand)
      values ('booking_created', v_session.player_id, v_session.game_id, v_booking,
              jsonb_build_object('seats', v_wanted, 'paid_thb', p_amount_thb,
                                 'rail', 'checkout'),
              v_game.city, v_game.brand);

      insert into public.events (event_type, player_id, game_id, booking_id, metadata, city, brand)
      values ('payment_confirmed', v_session.player_id, v_session.game_id, v_booking,
              jsonb_build_object('amount_thb', p_amount_thb,
                                 'session', p_stripe_session_id),
              v_game.city, v_game.brand);

      update public.checkout_sessions
         set status = 'booked', booking_id = v_booking, settled_at = now()
       where id = v_session.id;

      perform public.sync_game_fullness(v_session.game_id);
      return 'booked';
    end if;
  end if;

  /*
   * NO SEAT. THE MONEY BECOMES CREDIT, IN FULL — and this is now the ending
   * for a vanished booking as well as for a full pitch. Both are "we cannot
   * give you what you paid for", and both pay back the same way.
   */
  -- ROUND 40: the payment bought a Credit today, valid credit_validity_days().
  insert into public.credit_ledger (player_id, delta_thb, reason, expires_at)
       values (v_session.player_id, p_amount_thb, 'cancellation_credit',
               now() + make_interval(days => public.credit_validity_days()));

  insert into public.events (event_type, player_id, game_id, metadata, city, brand)
  values ('credit_issued', v_session.player_id, v_session.game_id,
          jsonb_build_object('amount_thb', p_amount_thb,
                             'reason', case when v_already_in then 'checkout_already_booked'
                                            else 'checkout_game_full' end,
                             'kind', v_session.kind,
                             'session', p_stripe_session_id),
          v_game.city, v_game.brand);

  perform public.notify_player(
    v_session.player_id,
    case when v_already_in
         then 'You already had a spot in this game'
         when v_session.kind = 'add_guests'
         then 'The game filled before your guests were added'
         else 'The game filled while you were paying' end,
    case when v_already_in
         then 'You paid for a spot you already had, so nothing new was booked. The full amount is in your wallet '
           || 'as credit and applies to your next booking automatically.'
         when v_session.kind = 'add_guests'
         then 'Your payment arrived just after the last spot went, so your '
           || 'guests could not be added. The full amount is in your wallet as '
           || 'credit and applies to your next booking automatically.'
         else 'Your payment arrived just after the last spot went. The full '
           || 'amount is in your wallet as credit and applies to your next '
           || 'booking automatically.' end,
    case when v_already_in then null else 'checkout_game_full' end,
    null);

  update public.checkout_sessions
     set status           = 'credited',
         settled_at       = now(),
         attention_at     = now(),
         attention_reason = 'paid ' || p_amount_thb::text
                         || ' THB for ' || v_session.kind
                         || case when v_already_in
                                 then ' while already holding a spot — credited in full'
                                 else ' after the game filled — credited in full' end,
         booking_id       = null
   where id = v_session.id;

  return 'credited';
end;
$function$;

revoke execute on function public.settle_checkout_session(text, integer) from public;
grant execute on function public.settle_checkout_session(text, integer) to service_role;
