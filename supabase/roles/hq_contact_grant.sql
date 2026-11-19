-- =============================================================================
-- Playllu HQ reads players' email and phone (Jachym, 19 Nov 2026: "yes it should show").
--
-- HQ's founders' player profile shows a Contact block for Hraj Fotbal players (HQ's supabase/roles/hq_contact_grant.sql,
-- applied 16 Nov). This file does the same for Playco, so a Bangkok player's profile in HQ shows their email and phone.
--
-- What it grants: SELECT on players.email and players.phone to `hq_readonly`, and nothing else. Auth ids, Stripe ids,
-- payment codes, organiser contacts, consent records and anything a player typed for staff stay out (docs/HQ_CONTRACT.md
-- rule 3). HQ checks has_column_privilege on every load: until this grant exists HQ shows no contact details, and the
-- revoke at the foot hides them again.
--
-- Where the data goes in HQ: the founders' player profile only. Never to team accounts (city managers, organisers),
-- Claude, URLs, analytics or exports (HQ's CLAUDE.md §1 rule 1 and §9). Founders are Playllu's platform admins, so this
-- keeps Playco's rule that email never leaves platform admin (CLAUDE.md §1 rule 6).
--
-- ORDER MATTERS: supabase/roles/hq_readonly.sql starts from nothing (it revokes every column), so running it again
-- removes this grant. Run this file after it, every time.
--
-- RUN BY JACHYM (or by Claude through the Supabase connector, with his yes) in project `playco`. Tested by
-- supabase/tests/hq_contact_grant.sql. Idempotent.
-- =============================================================================

grant select (email, phone) on public.players to hq_readonly;

-- To undo (HQ then hides the Contact block for Bangkok players):
-- revoke select (email, phone) on public.players from hq_readonly;
