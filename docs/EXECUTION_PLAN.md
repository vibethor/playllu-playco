# Playco — execution plan

Written 14 Nov 2026 for the agent that builds Playco. Read `CLAUDE.md` first, then this file top to bottom, then
`docs/upstream/CLAUDE.hrajfotbal.md` once (the inherited rules and the expensive lessons).

Work one phase at a time, in order. One pull request per phase into `main`. A phase is finished only when every line
of its **Done when** passes; paste the command output into the PR. Stop and ask Jachym on anything in `CLAUDE.md` §2.

---

## 1. What Playco is

One website for pickup games in Bangkok. One account, one wallet, one database, one admin — and a **separate view per
sport**: volleyball, football, basketball. **Only volleyball is switched on at launch.** Football is added later by
switching it on in admin and creating games; no code change, no new database.

### How the sport views work (the product model)

| Thing | Rule |
|---|---|
| Address | One domain. Each sport lives under its own path: `/volleyball`, `/football`, `/basketball` |
| `/` (home) | While one sport is on: goes straight to `/volleyball`. With two or more on: a short "pick your sport" page; the last sport a player used is remembered (cookie) and `/` goes there |
| Sport switcher | A control in the header listing the sports that are on. Hidden while only one sport is on |
| Inside a sport | Home, the games list, the game page, venues and "player of the month" show **only that sport** |
| Game links | `/game/<id>` stays one address for every sport (links shared on WhatsApp/LINE never break); the page takes its sport from the game |
| Across sports | One account, one profile, one wallet (baht), one "My games" list (each game tagged with its sport), one login |
| Per sport on a profile | Level and positions are kept per sport (a setter in volleyball can be a beginner in football) |
| A sport that is off | Its path returns "not found", it is absent from the switcher, sign-up, and filters. Admins can still prepare games for it as drafts |
| Admin | One admin panel. Every list has a sport filter. Sports are switched on and off in Admin → Site |
| Organisers | An organiser sees and manages only the games they run, in any sport |
| HQ | Reads every game with its `sport`, so Bangkok volleyball, football and basketball stay separate tracks |

Why paths and not subdomains or separate apps: one login cookie, one deploy, one Supabase redirect list, links that
are easy to share, and nothing to set up when a sport is added.

### What was learned from similar platforms

Reclub is what Bangkok volleyball and pickleball groups use today (e.g. "Bangkok Volley"). Its sessions take an RSVP
for the head count, show a fee with a **payment deadline after which the spot is cancelled automatically**, and leave
the cancellation rule to each host; payment is usually a bank transfer with the slip sent in chat. Playco already
does the first three better (pay-first booking, automatic waitlist, one written cancellation rule) and replaces the
slip with PromptPay through Stripe, which confirms by itself. What Reclub has and Playco does not: clubs run by
anyone, and a native app. Neither is in scope.

---

## 2. Decisions already made (do not reopen)

- Fork of HrajFotbal, own repo and database. Jachym approves every change.
- Money is THB, whole baht. No passes at launch. Same cancellation rule as HrajFotbal (cancel any time; refund to
  the wallet up to 8 hours before the start).
- Languages: English (default) and Thai.
- Payments: a Thai Stripe account — card and PromptPay — plus cash at the court confirmed by the organiser.
- Prices, venues and venue costs are entered in the admin panel, not in code.
- Free plans for now; the `*.vercel.app` address until tested; the domain comes later.
- **The hosted database is set up last** (Phase 10). Until then everything is built and tested on the local
  Postgres described in `CLAUDE.md` §4. Nothing before Phase 10 needs Supabase, Vercel or a secret.

## 3. Owner to-do list (Jachym; none of it blocks Phases 0–9)

See `TODO.md`. In short: the Supabase project, the Thai Stripe account, making this repo private, Vercel, the
domain, the legal texts, a Thai speaker to check the translation.

---

## 4. The phases

Order and dependencies:

```
0 Tooling ─ 1 Bangkok identity ─ 2 Sports in the database ─┬─ 3 Prices + staff seats ─┬─ 5 Wallet in baht ─ 6 Stripe
                                                           └─ 4 Sport views ──────────┘        7 Organisers (after 2)
8 Thai + legal (after 4, 6) ─ 9 HQ connection (after 2, 3) ─ 10 Hosted database + deploy ─ 11 Pilot ─ 12 Design ─ 13 Launch
```
Phases 3 and 4 touch different files and may run in parallel; everything else is sequential.

Rules that apply to every phase:
- New logic gets a failing test first (unit in `lib/**/__tests__`, SQL in `supabase/tests/`). Arrange / Act / Assert.
- Every state change is a `SECURITY DEFINER` RPC with `search_path = ''`; grants are explicit; `app_capabilities()`
  is restated in full with every earlier flag probed, never copied.
- New migrations get a Playco timestamp from `20261115…` on. Never edit an inherited migration.
- A catalogue that exists in SQL and in TypeScript (sports, surfaces, positions) gets a test that reads both.
- Copy goes in `lib/strings.ts`; no user-visible string in a component.
- Leave `docs/upstream/` untouched.

### Phase 0 — Tooling

Goal: one command proves the whole thing, locally and in CI.

1. Add `scripts/test-db.sh`: start the throwaway Postgres if needed, create a fresh database, apply
   `supabase/local/supabase_shim.sql`, apply every migration in order **twice** (the second run proves they are
   idempotent — fix the script, not the migration, if an inherited file is not), run every `supabase/tests/*.sql`,
   exit non-zero on any `FAIL` or `ERROR`.
2. Close the three known local gaps: install pgTAP for `notifications.sql` (or skip that file with a printed
   reason when the extension is missing); give `ledger_invariant.sql` the seeded player it needs; mark
   `profile_photos.sql` #14 as needing real Supabase storage.
3. `package.json`: `check` = `tsc --noEmit && eslint && vitest run`; `test:db` = the script; rename the package to
   `playco`.
4. `.github/workflows/ci.yml`: `npm ci`, `npm run check`, `npm run test:db` on a `postgres:16` service, `npm run
   build`. No secrets.
5. Rewrite `README.md` for Playco (what it is, quickstart, env variables, commands, architecture, how to port an
   upstream fix).

Done when: `npm run check` exits 0 · `npm run test:db` exits 0 and prints 0 failures · CI is green on the PR.

### Phase 1 — Bangkok identity

Goal: nothing in the running app says Prague, HrajFotbal, Czech or CZK-era wording. No behaviour change otherwise.

1. Time zone: every `Europe/Prague` (`lib/format.ts`, stats windows, email templates, cron, SQL) → `Asia/Bangkok`,
   through one constant in TypeScript and one SQL function `app_timezone()`.
2. Defaults: migration setting `games.city` and `venues.city` default to `bangkok`, `brand` to `playco`; every RPC
   that falls back to `'prague'` / `'hrajfotbal'` restated.
3. Languages: `LOCALES = ["en", "th"]`, default `en`. Delete `cs.ts`, `ru.ts`, `uk.ts`; add an empty `th.ts`
   overlay (filled in Phase 8). `games.language` catalogue becomes `en` / `th` (which language the game is run in).
4. Remove what is Prague-only: `lib/legacyHost.ts` and its use in `proxy.ts`; the Telegram route `app/api/tg`
   (keep the WhatsApp share route, add LINE in Phase 8); the Czech QR payment (`lib/payments/spd.ts`, `PAYMENT_IBAN`,
   the `qr` flow's Czech wording) — remove the UI entry now, the enum value is dealt with in Phase 6.
5. Names: site name, page titles, Open Graph card, PWA manifest, email sender name → "Playco". Colours and logo
   stay as they are until Phase 12; use a plain text wordmark.
6. Clean the comments the rename left wrong where they describe money (e.g. "THB has a hundred haléřů").
7. `vercel.json`: region `sin1`.
8. Football-only fields stay but become optional per sport in Phase 2: `format`, `subs_per_team`, `pitch_name`.

Done when: `grep -rniE "prague|praha|hraj ?fotbal|hrajsport|variabiln|QR platba|Kč" app components lib --include=*.ts
--include=*.tsx` returns nothing outside tests that assert their absence · `npm run check` and `npm run test:db`
exit 0 · a unit test formats `2026-11-15T10:00:00Z` as 17:00 Bangkok time.

### Phase 2 — Sports in the database

Goal: every game belongs to a sport; sports can be switched on and off; nothing is football-shaped by accident.

New migration(s):
1. `public.sports` — `key` (`volleyball` | `football` | `basketball`, CHECK), `enabled boolean`, `sort int`.
   Seeded: volleyball on, the others off. Readable by everyone; written only by `admin_set_sport_enabled(key, flag)`
   (admin only, logs `sport_enabled` / `sport_disabled`).
2. `games.sport text not null references sports(key)` — no default, so no writer can forget it.
   `venues.sports text[]` (which sports a venue hosts).
3. Per-sport catalogues as SQL functions with TypeScript mirrors in `lib/sports/`:
   - surfaces: volleyball `indoor`, `sand`; football `turf`, `grass`, `indoor`; basketball `indoor`, `outdoor`
   - formats: volleyball `6v6`, `4v4`, `2v2`; football `5v5`–`11v11`; basketball `5v5`, `3v3`
   - positions: volleyball setter, outside, middle, opposite, libero; football as inherited; basketball guard,
     forward, centre
   - default length: volleyball and basketball 120 min, football 90
   Replace `games_surface_known` with a check that the surface belongs to the game's sport.
4. `public.player_sports` — (`player_id`, `sport`) primary key, `skill_level`, `positions text[]`. This becomes the
   only source for level and positions. `players.skill_level` and `players.positions` are no longer read or written
   (find every reader with grep; leave the columns in place).
5. RPCs restated with a `p_sport` parameter as **new versions** (a changed parameter list is a new function, as
   upstream learned): `admin_create_game_v3`, `admin_update_game_v3`, `complete_signup_v3` (sports + level per sport),
   `set_player_sport(sport, level, positions)`. Public reads (`game_roster_public`, public profile, venue lists)
   return `sport`. A public read never returns a game whose sport is off.
6. `events.sport` stamped next to `city` and `brand` by every writer that has a game.
7. `app_capabilities()` gains `sports`.

Done when: SQL suite `sports.sql` exists and passes, covering: a game without a sport is refused · a volleyball game
with surface `turf` is refused · a non-admin cannot switch a sport · games of a switched-off sport are invisible to
`anon` and visible to an admin · `player_sports` holds different levels for two sports for one player · a
TS-vs-SQL catalogue test passes · `npm run test:db` and `npm run check` exit 0.

### Phase 3 — Prices and staff seats

Goal: the price of a game comes from a list Jachym edits in admin; staff play free.

1. `public.price_rules` — `sport`, optional `surface`, optional `venue_id`, optional `min_duration_minutes`,
   `price_thb`, `valid_from`, `valid_to`. `price_for_game(sport, surface, venue_id, duration)` returns the most
   specific open rule (venue beats surface beats sport); it raises a named error when no rule matches.
   It replaces `price_for_duration()`; both game writers call it; the admin form's price stays read-only.
   A price change closes the old rule (`valid_to`), so existing games keep their price.
2. Admin → Site → Prices: list, add, close a rule. RPCs `admin_add_price_rule`, `admin_close_price_rule`.
   No prices are seeded in a migration; the dev seed script adds volleyball 250, sand 300, 180-minute 300.
3. Staff seats: `games.staff_seats int not null default 3`. `payment_method` gains `staff`.
   `admin_add_staff(game, player)` books a 0-baht confirmed seat; at most `staff_seats` per game; staff seats do not
   reduce the capacity sold to players; they are flagged in the roster read and excluded from paid counts.
4. Venue costs: keep `venue_pitch_costs`, but per hour and without the summer/winter split
   (`cost_per_hour_thb`, optional per sport and court size: full / half). Entered in Admin → Venues.
5. Venue default capacity: `venues.default_capacity`; the game form prefills it.

Done when: SQL suite `pricing.sql` passes: no rule → named error · sport rule 250, surface rule 300 → a sand game
costs 300 · closing a rule leaves an existing game's price unchanged · a 4th staff seat is refused · a staff seat
does not take a paid place · `lib/games/price.ts` mirror test passes · `npm run test:db`, `npm run check` exit 0.

### Phase 4 — Sport views (structure only, not design)

Goal: the product model in §1 works in the browser with the inherited look.

1. Routes: `app/[sport]/page.tsx` (sport home), `app/[sport]/games/page.tsx`. `[sport]` is validated against the
   enabled sports; anything else is `notFound()`. `/games` redirects to the remembered or first enabled sport.
2. `/`: one enabled sport → redirect to it. Two or more → the sport picker; with a `playco_sport` cookie → that
   sport. The cookie is written in a route handler or server action, never during render.
3. Header: sport switcher, rendered only when two or more sports are on. Nav links carry the current sport.
4. `lib/sports/context.ts`: one function that resolves the current sport for a request (path → cookie → first
   enabled). Every list query takes it as an argument; no query reads it implicitly.
5. `/game/[id]`: unchanged address; sport-specific fields (format, positions, surface wording) come from the game's
   sport. A game of a switched-off sport is `notFound()` for non-admins.
6. `/my-games`, `/account`: all sports; each game shows its sport. Profile: one level + positions block per sport
   the player plays, with "add a sport".
7. Sign-up: "Which sports do you play?" limited to enabled sports; with one enabled it is preselected and not asked.
8. Admin: sport filter on games, players (plays sport X), venues and stats; the new-game form starts with the sport
   and shows that sport's surfaces, formats and default length; Admin → Site → Sports toggles.
9. Home panels (community, player of the month, FAQ) are per sport; FAQ copy for volleyball is written, football and
   basketball fall back to a generic text.
10. An error boundary per route segment already exists; add one for `[sport]`.

Done when: Playwright spec `e2e/sports.spec.ts` passes on the local stack: with only volleyball on, `/` lands on
`/volleyball`, no switcher is rendered, `/football` is a 404 · after an admin switches football on, `/` shows the
picker, the switcher lists both, a football game appears only under `/football`, and `/game/<id>` opens for both ·
switching football off again restores the first state · `npm run check` exits 0.

### Phase 5 — The wallet in baht

Why this is its own phase: HrajFotbal's wallet counts **credits as seats at one flat price** (migration
`20260915100000_credits_are_seats.sql`, `credit_seat_price_thb()`), because every Prague game costs the same. In
Bangkok a game costs 250 or 300, and there are no passes, so a "credit" has no fixed value.

1. The wallet is an amount in baht. A refunded cancellation returns exactly what was paid for that seat. Paying from
   the wallet spends up to the game's price; a shortfall is paid by card/PromptPay in the same checkout
   (`credit_applied_thb` already exists for this).
2. Restate the booking, guest, cancel and admin-credit RPCs so none calls `credit_seat_price_thb()`; drop the
   "whole number of credits" invariant; admin grants are entered in baht.
3. UI: the wallet shows baht, never "N credits".
4. Passes: `/pass` and its cron return "not found" behind one flag `PASSES_ENABLED = false`; the tables stay.
5. The 60-day expiry of wallet credit: keep it (same rule as HrajFotbal) unless Jachym says otherwise — **ask**.

Done when: SQL suite `wallet_baht.sql` passes: cancel a 300-baht seat in time → +300 · book a 250 game with 300 in
the wallet → 50 left, nothing to pay · book a 300 game with 250 → 50 due online · a late cancellation returns 0 ·
the ledger sum always equals the balance · the rewritten inherited suites pass · `npm run test:db` exits 0.

### Phase 6 — Stripe (Thailand), test mode

Goal: a player pays by card or PromptPay in baht; the booking confirms by itself. Built entirely in Stripe test
mode, which needs no verified account. Read §5 before starting.

1. `lib/payments/embeddedCheckout.ts`: `CHECKOUT_PAYMENT_METHOD_TYPES = ["card", "promptpay"]`, currency `thb`
   (Stripe counts in satang: baht × 100 — the existing minor-unit helpers already do this).
2. PromptPay shows a QR the player scans in their banking app. The seat is held by `open_checkout` exactly as for a
   card; confirmation still comes only from the webhook (`settle_checkout_session`). Handle
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
   and `checkout.session.expired`; an unpaid QR releases the seat when the session expires. Set the session expiry
   to a named constant.
3. `payment_method` enum: add `card`, `promptpay`; `qr` is no longer offered (enum values cannot be dropped — leave
   it unused and say so in the migration).
4. Cash: the player chooses "pay at the court"; the seat is reserved; the organiser confirms in admin
   (`confirm_cash_payment`, organiser of that game or admin). Whether cash holds a seat without limit or expires
   before the game: **ask Jachym**.
5. Environment variables (names only, values are Jachym's): `STRIPE_SECRET_KEY`,
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`. Remove `PAYMENT_IBAN`,
   `NEXT_PUBLIC_STRIPE_PAYMENT_URL`, `NEXT_PUBLIC_STRIPE_PASS_URLS`. Update `.env.example` and the README.
6. Refunds stay wallet-only (no money leaves Stripe from the app), as in HrajFotbal.

Done when: unit tests cover the webhook for all four events with recorded test payloads · an SQL test shows an
expired PromptPay session frees the seat for the next player on the waitlist · `grep -rn "sk_live\|sk_test\|whsec_"`
over the repo returns nothing · `npm run check`, `npm run test:db` exit 0.
(The click-through with a real test-mode QR happens in Phase 10, when there is a deployed webhook address.)

### Phase 7 — Organisers

Goal: Steven and Sofi run their own games without seeing the rest.

1. Authorisation inside the RPCs: an organiser may edit, mark attendance on, confirm cash for, add staff to and
   cancel only games where they are `organizer_player_id`. Admins may do everything.
2. Admin panel: an organiser sees only their games, the players booked on them (nickname and level, never email;
   phone only as today's organiser-contact rule allows), and their own totals.
3. Per-game totals for the organiser: paid seats, cash to collect, online collected, venue cost, profit.

Done when: SQL suite `organiser_scope.sql` passes: organiser A cannot edit, confirm cash on, or read the booking
list of organiser B's game; an admin can; a player who is not an organiser can do none of it.

### Phase 8 — Thai, phone, legal

1. Fill `lib/i18n/th.ts`. The inherited test that walks every player-facing key must pass for `th`. Mark the PR
   "needs a Thai speaker's review" — machine translation is not a release.
2. Phone: default country +66; validation with the existing `libphonenumber-js`.
3. Sharing: keep the WhatsApp share route, add a LINE share link.
4. Legal: `/privacy` (Thai PDPA), `/terms`, `/cookies` from texts Jachym supplies — draft them in `content/` as
   **drafts marked as such**, and stop for his approval. The seller named in the terms must match the Stripe
   account's owner (§5).
5. Emails: sender name and wording for Playco; emails stay English (as upstream) until `players.locale` exists.

Done when: the i18n key-coverage test passes for `th` · a unit test accepts `081 234 5678` as a Thai mobile and
formats it `+66 81 234 5678` · `/privacy`, `/terms` render in the build.

### Phase 9 — HQ connection

In this repo:
1. `supabase/roles/hq_readonly.sql`: read-only role, `SELECT` on named columns only — players (no email, phone,
   auth id), games (with `sport`), bookings, credit ledger, checkout sessions, events, venue costs, price rules.
2. `docs/HQ_CONTRACT.md`: the exact columns HQ reads. A change to any of them is a change to HQ too.

In `playllu/playllu-hq` (a separate PR there, under HQ's own rules):
3. `PLAYCO_DB_READONLY_URL` in `.env.example`; `src/data/playco-source.ts` mapping Playco rows to HQ's raw rows with
   `source = 'playco'` and currency THB; players keyed by (source, id); a cutover date after which Bangkok games come
   only from Playco; HQ's golden numbers unchanged.

Done when: `npm run test:db` here proves the role cannot read `players.email` or `players.phone` and cannot write
anything · HQ's `npm run check` and `npm run test:db` are green with a Playco fixture.

### Phase 10 — Hosted database and deploy (first phase that needs accounts)

Needs from Jachym: a Supabase project slot (see `TODO.md`), a Vercel project connected to this repo, Stripe
test-mode keys pasted into Vercel.

1. Create `playco-staging` in the Playco org, region `ap-southeast-1`. Apply every migration in order. Run the SQL
   suites against it. Check `get_advisors` for security findings and fix them.
2. Supabase Auth: Site URL and redirect list = the Vercel address (they must match `NEXT_PUBLIC_SITE_URL` exactly);
   email templates from `docs/upstream/AUTH_EMAIL_TEMPLATE.md` re-branded.
3. Vercel: env variables (Jachym pastes), region `sin1`.
4. **Cron:** the inherited `*/5 * * * *` job will not deploy on Vercel's free plan (free cron runs at most once a
   day). Move the frequent jobs to Supabase `pg_cron` calling the same RPCs, or ask Jachym about Vercel Pro.
   Note for Jachym: Vercel's free plan is for non-commercial use; taking real payments needs Pro.
5. Stripe test mode: register the webhook for the deployed address; pay one booking by test card and one by test
   PromptPay end to end.
6. Seed: sports, Steven / Sofi / Jay as organisers, the venues — through the admin panel, not SQL.

Done when: the deployed site loads `/volleyball` · a test booking by card and one by PromptPay reach `confirmed`
through the webhook · a cancellation credits the wallet · the Playwright smoke suite passes against the deployment.

### Phase 11 — Pilot
One real week: every volleyball game is created in Playco and announced in WhatsApp with the game link. Stripe stays
in test mode until Phase 13 is approved, so pilot players pay cash at the court. Collect what breaks. HQ compares Playco's numbers with the hand-entered ones for the same week.

### Phase 12 — Design
The Playco look on the same components: tokens in `tailwind.config.ts`, logo, Open Graph card, PWA icons, a sport
accent colour per view. No structural change.

### Phase 13 — Launch gate
Live Supabase project; live Stripe keys; domain; 3-of-3 approval in HQ; WhatsApp groups point to Playco.

---

## 5. Stripe: what was found (14 Nov 2026)

**Can the existing Playllu Stripe account be used?** Not for this. A Stripe account belongs to one country and that
cannot be changed, and PromptPay is offered only to accounts based in Thailand. Charging baht on the current account
would work for cards only and would pay out converted.

**Can it sit under the same login?** Yes. In the Stripe dashboard, open the account selector (top left) and choose
"New account"; pick Thailand. It is a separate account with its own verification, bank account, balance, keys and
webhooks, reachable from the same login. This is not Stripe Connect and needs no platform setup.

**As an individual, before the company exists:** Stripe Thailand lists "Individual" among its business types. A
non-Thai national verifies with a passport. Stripe asks for a current residential address. A Thai account can
charge in many currencies but is paid out only in THB, so it needs a Thai bank account in the same name.

**Not confirmed — ask Stripe support before relying on it:**
- whether a foreigner living in Thailand is accepted as an "Individual" without a Thai company (Stripe's pages do
  not say; third-party guides say individual accounts are for residents);
- what happens when the company is registered — usually a different legal entity means a **new** Stripe account
  (for the app that is only three new keys in Vercel; history stays in the old account).

**Outside Stripe:** taking business income in Thailand as a foreign individual has work-permit and tax
consequences. That is a question for a Thai accountant, not for this plan.

**For the build:** none of this blocks Phase 6. A Stripe account in test mode (a "sandbox") gives working keys and
test PromptPay QR codes without any verification.

Sources: Stripe support — "Supported payment methods, currencies, and businesses for Stripe accounts in Thailand",
"What information is required to open a Stripe account in Thailand?", "What documents are accepted to verify my
account in Thailand?", "Thailand FAQ"; Stripe docs — PromptPay payments, Multiple accounts, Organizations.

---

## 6. Adding football later (the check that the model works)

1. Admin → Site → Sports: switch football on.
2. Admin → Site → Prices: add a football price.
3. Admin → Venues: add the football venue, its cost per hour and default capacity.
4. Make someone the organiser; create the games.

`/` now shows the sport picker, the header shows the switcher, `/football` is live. If any of this needs a code
change, Phase 2 or Phase 4 was not finished.
