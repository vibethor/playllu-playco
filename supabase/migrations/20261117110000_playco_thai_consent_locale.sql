-- =============================================================================
-- PLAYCO — consent records accept Thai (part of the English + Thai website, approved 16 Nov 2026).
--
-- `consent_records.locale` stores which language the person read the terms wording in, and only allowed HrajFotbal's
-- four (en, cs, ru, uk). With the site served in Thai, a Thai visitor accepting the terms at sign-up or checkout
-- would be refused by this CHECK and could neither sign up nor book. Widening it is additive: every existing row
-- still satisfies the new list. Idempotent; verified at the foot.
-- =============================================================================

alter table public.consent_records drop constraint if exists consent_records_locale_check;
alter table public.consent_records add constraint consent_records_locale_check
  check (locale in ('en', 'th', 'cs', 'ru', 'uk'));

do $$
begin
  if (select pg_get_constraintdef(oid) from pg_constraint
       where conrelid = 'public.consent_records'::regclass and conname = 'consent_records_locale_check')
     not like '%''th''%' then
    raise exception 'thai consent locale: the check does not accept th';
  end if;
end $$;
