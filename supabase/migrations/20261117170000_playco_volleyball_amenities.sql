-- =============================================================================
-- PLAYCO — volleyball amenities.
--
-- The owner, 17 Nov 2026: what a venue provides is "balls, game organizer";
-- its amenities are "showers, parking, drinks, snacks, changing rooms, wifi,
-- towel rental". The catalog was HrajFotbal's football list.
--
-- ADDITIVE: four values join the catalog (organizer, snacks, changing_rooms,
-- towel_rental). The football values stay valid so no venue row is rewritten
-- or made invalid; the admin form simply stops offering them
-- (lib/venues/amenities.ts).
--
-- Test: supabase/tests/playco_amenities.sql.
-- =============================================================================

alter table public.venues drop constraint if exists venues_amenities_catalog;
alter table public.venues add constraint venues_amenities_catalog check (
  amenities <@ array[
    -- Playco: provided by the venue / organizer
    'balls', 'organizer',
    -- Playco: the venue's own
    'showers', 'parking', 'drinks', 'snacks', 'changing_rooms', 'wifi', 'towel_rental',
    -- HrajFotbal's, no longer offered, still valid on old rows
    'bibs', 'gloves', 'water', 'lockers', 'first_aid'
  ]::text[]
);

create or replace function public.set_venue_amenities(p_venue_id uuid, p_amenities text[])
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clean text[];
begin
  if not (public.is_admin_caller() or public.is_service_role()) then
    raise exception 'INSUFFICIENT_PERMISSION' using detail = 'admin only';
  end if;

  if not exists (select 1 from public.venues where id = p_venue_id) then
    raise exception 'VENUE_NOT_FOUND';
  end if;

  -- Distinct and ordered, so the same boxes ticked in a different order make
  -- the same row and the grid renders in one stable order.
  select coalesce(array_agg(a order by a), array[]::text[])
    into v_clean
    from (select distinct unnest(coalesce(p_amenities, array[]::text[])) as a) s;

  if not (v_clean <@ array[
    'balls', 'organizer',
    'showers', 'parking', 'drinks', 'snacks', 'changing_rooms', 'wifi', 'towel_rental',
    'bibs', 'gloves', 'water', 'lockers', 'first_aid'
  ]::text[]) then
    raise exception 'AMENITY_UNKNOWN' using detail = array_to_string(v_clean, ',');
  end if;

  update public.venues set amenities = v_clean where id = p_venue_id;

  return v_clean;
end $$;
revoke execute on function public.set_venue_amenities(uuid, text[]) from public, anon;
grant execute on function public.set_venue_amenities(uuid, text[]) to authenticated, service_role;

comment on function public.set_venue_amenities(uuid, text[]) is
  'Admin-only. REPLACES the venue''s amenity set. Deduplicates and sorts so the grid '
  'order is stable. Playco catalog (17 Nov 2026): balls, organizer, showers, parking, '
  'drinks, snacks, changing_rooms, wifi, towel_rental (+ HrajFotbal''s, kept valid).';
