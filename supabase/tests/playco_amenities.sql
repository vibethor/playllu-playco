-- =============================================================================
-- PLAYCO — a volleyball venue's "what's provided" and amenities.
--
-- The owner, 17 Nov 2026: what the venue provides is "balls, game organizer";
-- amenities are "showers, parking, drinks, snacks, changing rooms, wifi, towel
-- rental". The catalog was HrajFotbal's football list (bibs, gloves, …).
--
--   * every one of the owner's nine can be saved
--   * a value outside the catalog is still refused
--   * the football values stay accepted, so no venue row becomes invalid
--
-- Run:  node supabase/tests/run.mjs playco_amenities
-- =============================================================================
begin;

create temp table _results (
  seq serial primary key, label text, passed boolean, detail text
) on commit drop;

create function pg_temp.ok(cond boolean, label text, detail text default '')
returns void language plpgsql security definer as $$
begin
  insert into _results (label, passed, detail) values (label, coalesce(cond, false), detail);
end $$;

create function pg_temp.act_as(p_uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
end $$;

create function pg_temp.probe(sql text)
returns text language plpgsql as $$
declare n integer;
begin
  execute 'with _p as (' || sql || ') select count(_p::text) from _p' into n;
  return 'rows:' || n;
exception
  when insufficient_privilege then return 'denied';
  when others then
    if sqlstate = 'P0001' then return 'raise:' || sqlerrm; end if;
    return 'error:' || sqlstate;
end $$;

insert into auth.users (id, email) values
  ('72000000-0000-0000-0000-000000000001', 'pam-admin@test.invalid');
insert into public.players (id, nickname, email, auth_user_id, is_admin) values
  ('7f000000-0000-0000-0000-000000000001', 'PAMAdmin', 'pam-admin@test.invalid',
   '72000000-0000-0000-0000-000000000001', true);
insert into public.venues (id, name) values
  ('7d000000-0000-0000-0000-000000000001', 'PAM Asoke');

select pg_temp.act_as('72000000-0000-0000-0000-000000000001');

select pg_temp.ok(
  pg_temp.probe($q$select public.set_venue_amenities('7d000000-0000-0000-0000-000000000001'::uuid,
    array['balls', 'organizer'])$q$) = 'rows:1',
  'provided: balls and a game organizer',
  pg_temp.probe($q$select public.set_venue_amenities('7d000000-0000-0000-0000-000000000001'::uuid,
    array['balls', 'organizer'])$q$));

select pg_temp.ok(
  pg_temp.probe($q$select public.set_venue_amenities('7d000000-0000-0000-0000-000000000001'::uuid,
    array['balls', 'organizer', 'showers', 'parking', 'drinks', 'snacks', 'changing_rooms', 'wifi', 'towel_rental'])$q$) = 'rows:1',
  'all nine of the owner''s list save together',
  pg_temp.probe($q$select public.set_venue_amenities('7d000000-0000-0000-0000-000000000001'::uuid,
    array['balls', 'organizer', 'showers', 'parking', 'drinks', 'snacks', 'changing_rooms', 'wifi', 'towel_rental'])$q$));

reset role;
select pg_temp.ok(
  (select amenities = array['balls', 'changing_rooms', 'drinks', 'organizer', 'parking', 'showers', 'snacks', 'towel_rental', 'wifi']
     from public.venues where id = '7d000000-0000-0000-0000-000000000001'),
  'stored deduplicated and in one stable order',
  (select array_to_string(amenities, ',') from public.venues where id = '7d000000-0000-0000-0000-000000000001'));

select pg_temp.act_as('72000000-0000-0000-0000-000000000001');
select pg_temp.ok(
  pg_temp.probe($q$select public.set_venue_amenities('7d000000-0000-0000-0000-000000000001'::uuid,
    array['sauna'])$q$) like 'raise:AMENITY_UNKNOWN%',
  'something outside the list is still refused');
select pg_temp.ok(
  pg_temp.probe($q$select public.set_venue_amenities('7d000000-0000-0000-0000-000000000001'::uuid,
    array['bibs', 'lockers'])$q$) = 'rows:1',
  'the football values stay valid, so no existing venue breaks');
reset role;

select seq, label, case when passed then 'PASS' else 'FAIL' end as result, detail
from _results order by seq;

select count(*) as total,
       count(*) filter (where passed) as passed,
       count(*) filter (where not passed) as failed,
       case when count(*) filter (where not passed) = 0
            then 'ALL PASS' else 'HAS FAILURES' end as summary
from _results;

rollback;
