# What Playllu HQ reads from Playco

*17 November 2026. Plan Phase 13. The role is `supabase/roles/hq_readonly.sql`; its test is
`supabase/tests/hq_readonly_role.sql`.*

Playllu HQ (`playllu/playllu-hq`) is the founders' dashboard. It reads Playco's production database through the role
`hq_readonly`, the same way it reads HrajFotbal: read-only sessions, SELECT on the columns below and nothing else.

## The rules

1. **A column listed here is never renamed, dropped or given a new meaning** without a pull request in `playllu-hq`
   first. HQ's numbers (revenue, paying players, profit) are computed from these columns.
2. **Adding** a column to this list needs a line here, a grant in the role file and an assertion in its test.
3. **Never** granted: auth ids, Stripe ids, payment codes, organiser contact details, consent records, anything a
   player typed for staff. HQ shows nicknames.
   **Contact details, by their own grant** (Jachym, 19 Nov 2026): `supabase/roles/hq_contact_grant.sql` gives
   `hq_readonly` `players.email` and `players.phone`, and nothing else, so HQ's founders' player profile shows a
   Bangkok player's contact details the way it shows a Hraj Fotbal player's. HQ shows them there only: never to team
   accounts, Claude, URLs, analytics or exports. The role file revokes everything first, so the contact grant is run
   after it every time; its own revoke hides them again. Tested by `supabase/tests/hq_contact_grant.sql`.
4. **HQ never writes** to Playco. Changes to Playco go through pull requests here.
5. Jachym runs the role file in the Supabase SQL editor and sets the password there himself. The connection string
   goes straight into HQ's Vercel project as `PLAYCO_DB_READONLY_URL` (user `hq_readonly.ldjyayedrkwnozcdttdy`,
   transaction pooler). It never passes through chat or a commit.

## Money

Every amount is a **whole number of Thai baht**, in columns ending `_thb` (the fork's rename of HrajFotbal's `_czk`).
Phase 1 of the plan changes this to `*_minor` + `currency`; when it does, this file and HQ change in the same week.
Time stamps are `timestamptz`; Bangkok games are in `Asia/Bangkok`.

## Tables and columns

| Table | Columns | Meaning |
|---|---|---|
| `players` | `id, nickname, country, skill_level, marketing_opt_in, created_at, is_admin, is_seed, deleted_at, banned_at, photo_path, is_organizer, referred_by, referred_at` | One row per account. `is_admin` and `is_seed` rows are not real players. `referred_by` is the player whose referral code was used at sign-up. |
| `games` | `id, game_number, city, brand, language, venue, venue_id, starts_at, duration_minutes, capacity, price_thb, status, format, surface, guest_count, created_at` | One row per game. `status`: draft, published, full, played, settled, cancelled. `guest_count` = free staff seats. There is no `sport` column yet; HQ maps a game to a sport by its venue until one is added. |
| `bookings` | `id, game_id, player_id, status, payment_method, price_thb, credit_applied_thb, guest_count, is_seed, booked_by_admin, attendance, created_at` | One row per booking. `price_thb` is what was charged in money; `credit_applied_thb` what came from the wallet or a pass. `payment_method` `qr` is an online (Stripe) payment, inherited name. `guest_count` = extra seats bought for friends. |
| `credit_ledger` | `id, player_id, delta_thb, reason, booking_id, created_at, expires_at, batch_id` | Every wallet movement, append-only. One credit = one seat (300 THB). Pass credits expire 60 days after purchase; credit from a cancellation does not. |
| `credit_topups` | `id, player_id, amount_thb, received_amount_thb, status, pass_games, city, created_at, confirmed_at` | Game-pass purchases. `pass_games` = 5, 10 or 20. |
| `checkout_sessions` | `id, player_id, game_id, guest_count, amount_thb, status, booking_id, kind, created_at, settled_at` | Stripe Checkout sessions for games, without the Stripe id. `kind`: `booking` or `add_guests`. Pass purchases are in `credit_topups`. |
| `events` | `id, event_type, player_id, game_id, booking_id, metadata, city, brand, created_at` | The app's audit trail (e.g. `game_cancelled`, `booking_cancelled` with `metadata.forfeited_thb`). |
| `game_pitch_costs` | `game_id, cost_thb, set_by_hand, updated_at` | What the court cost for a game: the venue's hourly price × the game's length, unless an admin typed it (`set_by_hand`). |
| `venues` | `id, name, city, archived_at` | Courts. |
| `venue_pitch_costs` | `venue_id, summer_thb, winter_thb, updated_at` | A venue's hourly price, read for the current pitch season (Playco's admin form sets one price per venue). |
| `pass_tiers` | `games, price_thb, credited_thb, expires_months` | Pass prices: 5 / 10 / 20 games for 1,380 / 2,640 / 4,800 THB. |

## Business rules HQ applies to these rows

These are Playco's rules as of 17 Nov 2026, and HQ needs them to compute the same numbers:

- Every game costs 300 THB. One credit is one seat.
- Cancelling 12 hours or more before the start returns the money to the wallet as credit; later, the seat is kept as
  revenue.
- Three free staff seats per game (Steven, Sofi, Jay).
- Bangkok volleyball deal: the organiser gets 50% of a game's profit; **Playllu covers losses**, never the organiser.
- HQ's cutover: games before the first real paid Playco game come from HQ's hand-entered list; from that date, from
  this database. Test bookings before it are ignored.
