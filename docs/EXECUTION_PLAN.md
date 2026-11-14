# Playco — execution plan (v2, franchise-ready)

Written 15 Nov 2026 for the agent that builds Playco. It replaces v1 (14 Nov). Read `CLAUDE.md` first, then this file
top to bottom, then `docs/upstream/CLAUDE.hrajfotbal.md` once (inherited rules and the expensive lessons).

Work one phase at a time, in order. One pull request per phase into `main`. A phase is finished only when every line
of its **Done when** passes; paste the command output into the PR. Stop and ask Jachym on anything in `CLAUDE.md` §2.

---

## 1. What is being built

**Playllu** is the platform: one codebase, one database per region, many cities, many team sports. **Playco** is the
brand players see. The first launch is **Bangkok volleyball**. The second city must be a row in the database and a
manager's invitation — not a new project.

The one sentence that decides most design questions: *a new city with a new manager must cost nothing to switch on
and nothing to switch off.*

### The model

| Thing | Rule |
|---|---|
| City | A row: name, slug, country, **currency**, **time zone**, languages, payment account, enabled sports, status (draft / live / paused) |
| Sport | Volleyball, football, basketball. Switched on **per city** |
| Address | One domain. `/<city>/<sport>` — e.g. `/bangkok/volleyball`. While one city and one sport are live, `/` goes straight there and no picker or switcher is shown |
| Game link | `/game/<id>` for every city and sport, so shared links never break |
| Player | One account for every city and sport. Level and positions per sport. One wallet **per currency** |
| Roles | **Platform admin** (Playllu) › **City manager** (one or more cities) › **Organiser** (their own games) › **Player**. Each sees and changes only its own scope; the check is inside every database function |
| Money in | Always to Playllu, through the payment account the city is linked to. Never to a manager's or organiser's own account |
| Money out | Profit share. The app computes what each city manager is owed; Playllu pays them; the manager settles with their organisers as they agree |
| Data | Players belong to Playllu. A manager who leaves loses access; nothing is exported or deleted |
| Brand | Playco. A city may carry its own name and domain later ("brand" is a field on the city), not built now |
| HrajFotbal | Stays a separate app. Not migrated. Fixes are ported by hand when wanted (`UPSTREAM.md`) |
| China and similar | Out of scope. Markets that need local hosting, licences or other payment rails are a separate installation of this code, decided case by case |

### What is configuration, from day one

Four things the code may never assume: **currency**, **time zone and language**, **payment provider and account**,
**which city**. Everything else may be Bangkok-shaped until the second city asks for more.

### Cost of a new city

One shared database and one deployment mean a new city adds **no monthly cost**. A manager who leaves after two
weeks costs a paused row. A new *region* (Europe, Middle East) is a second database and deployment of the same code,
added only when latency or data law requires it.

---

## 2. Decisions (do not reopen)

- One platform, cities as data, one database per region. Region 1: Southeast Asia (Singapore).
- Playllu controls the cash flow and owns the player data. City managers are paid a profit share.
- City managers are approved by Playllu: invited, or apply and are approved. Never self-service to live.
- Web app, installable to the home screen. Login: email, password, Google.
- Levels are shown, not enforced. No no-show penalties: players pay up front and a no-show keeps nothing.
- Cancellation: any time; refund to the wallet up to 8 hours before. A real-money refund is the exception: requested
  by the player, approved by the organiser or the city manager.
- No passes at launch. Passes, then an unlimited monthly plan, come later — nothing built now may block them.
- **No cash.** A seat exists only once it is paid online (or is a staff seat, or paid from the wallet).
- Wallet credit from a cancellation does not expire. The 60-day expiry belongs to passes only.
- Standard city-manager deal: 50% of profit, 50% of a loss.
- A city manager sees the phone numbers of players who booked in their city, for as long as they hold the role.
- Referral: every player gets a code, and sign-up records who referred them, from day one. The reward comes later.
- Recurring games: the manager creates a game in the admin panel and ticks "repeats weekly"; the following
  weeks are created and published automatically until the manager changes or stops it.
- Support is the manager's or the organiser's job; the app shows players who to contact per game.
- Build with agents and Jachym now; a developer or agency later. So: plain structure, tests, README, no cleverness.
- **The hosted database is set up last** (Phase 12). Everything before it runs on the local Postgres of `CLAUDE.md` §4.

## 3. What v1 got wrong (and what this version changes)

1. v1 renamed money to `_thb`. Money is now **an integer amount in the currency's smallest unit plus a currency
   code** (`price_minor`, `currency`). 250 baht is `25000` / `THB`; 9 euro is `900` / `EUR`.
2. v1 had "Bangkok identity" as a phase. It is now "location as configuration".
3. v1 had two roles. There are four.
4. v1 switched sports on globally. They are switched on per city.
5. v1 let organisers hold cash. **There is no cash.** Players prepay online; all money goes to Playllu.
6. v1 had no way to pay anyone. Deals, statements and payouts are now part of the app.

---

## 4. The phases

```
0 Tooling ─ 1 Money as amount+currency ─ 2 Cities and configuration ─ 3 Roles ─ 4 Sports per city
─┬─ 5 Prices, staff seats, venue costs ─┬─ 7 Wallet per currency ─ 8 Payments ─ 9 Deals and statements
 └─ 6 City and sport views ─────────────┘
10 Recurring games, referral codes ─ 11 Languages, phone, legal ─ 12 Hosted database + deploy
─ 13 HQ connection ─ 14 Pilot ─ 15 Design ─ 16 Launch ─ 17 Second city (the proof)
```
5 and 6 touch different files and may run in parallel. Everything else is sequential.

Rules for every phase:
- New logic gets a failing test first (unit in `lib/**/__tests__`, SQL in `supabase/tests/`). Arrange / Act / Assert.
- Every state change is a `SECURITY DEFINER` RPC with `search_path = ''`; grants are explicit; a changed parameter
  list is a new function version; `app_capabilities()` is restated in full with every earlier flag probed.
- New migrations get a Playco timestamp from `20261116…` on. Never edit an inherited migration.
- **No city, currency, time zone, language or country literal** in `app/`, `components/`, `lib/` or a new migration.
  They come from the city row. Phase 2 adds a test that greps for them; it must stay green in every later phase.
- Every table a manager can reach has a `city_id` and every read and write is scoped by it.
- Copy goes in `lib/strings.ts`. Leave `docs/upstream/` untouched.

### Phase 0 — Tooling

1. `scripts/test-db.sh`: start the throwaway Postgres, fresh database, `supabase/local/supabase_shim.sql`, every
   migration in order, every `supabase/tests/*.sql`; exit non-zero on any `FAIL` or `ERROR`.
2. Close the three local gaps (pgTAP for `notifications.sql` or a printed skip; a seeded player for
   `ledger_invariant.sql`; `profile_photos.sql` #14 marked as needing real storage).
3. `package.json`: name `playco`; `check` = `tsc --noEmit && eslint && vitest run`; `test:db`.
4. `.github/workflows/ci.yml`: check, database tests on a `postgres:16` service, build. No secrets.
5. `README.md` rewritten for Playco / Playllu.

Done when: `npm run check` exits 0 · `npm run test:db` exits 0 with 0 failures · CI green.

### Phase 1 — Money as amount + currency

1. Extend `scripts/fork/rename-currency.mjs` (or add a second script) to turn every `_thb` name into a neutral one:
   `price_thb` → `price_minor`, `formatThb` → `formatMoney`, and so on. Keep it idempotent and scripted — it is still
   how an upstream fix is ported.
2. One migration: every table that stores money gains `currency text not null` (ISO code, CHECK against a
   `currencies` table holding code and decimal places: THB 2, EUR 2, VND 0, AED 2, CZK 2). Amounts are integers in
   the smallest unit. Every RPC that moves money takes the currency from the game's city and refuses to add or
   compare two currencies.
3. `lib/money/`: `formatMoney(amountMinor, currency, locale)` and conversion to and from Stripe's units, driven by
   the decimal places. Remove every hard-coded "THB"/"CZK" in display text.
4. Remove the Czech QR payment (`lib/payments/spd.ts`, `PAYMENT_IBAN`) and its UI.

Done when: `grep -rniE "_thb|_czk|\bTHB\b|\bCZK\b" app components lib supabase/migrations/2026111*` finds only the
currencies seed and tests · a unit test formats `25000 THB` as "250 THB"/"฿250" and `150000 VND` with no decimals ·
an SQL test shows a booking in one currency cannot spend wallet money of another · `npm run check`, `npm run
test:db` exit 0.

### Phase 2 — Cities and configuration

1. `public.cities`: `id`, `slug`, `name`, `country`, `currency`, `timezone`, `locales text[]`, `default_locale`,
   `phone_country`, `payment_account` (a key, not a secret), `brand` (default `playco`), `status`
   (`draft` | `live` | `paused`), `support_contact`.
2. `games`, `venues`, `events`, and every table reached from them, reference `city_id` (replacing the free-text
   `city`/`brand` columns for all new reads; the old columns stay, unread).
3. Time: every place that says `Europe/Prague` takes the game's city time zone. Cron jobs loop over cities.
4. Languages: `LOCALES` becomes the union of what cities list; start with `en`, `th`. Delete `cs`, `ru`, `uk`.
5. `lib/city/context.ts`: one function resolves the city for a request (path → cookie → the only live city).
   Every query takes the city as an argument.
6. Remove Prague-only code: `lib/legacyHost.ts`, the Telegram route. Names → "Playco" (text wordmark for now).
7. Seed (dev only): Bangkok, THB, Asia/Bangkok, `en`+`th`, +66, draft.
8. Add `tests/no-location-literals.test.ts`: fails on `prague|bangkok|Europe/|Asia/|'THB'|\+66|\+420` in `app/`,
   `components/`, `lib/` outside tests and seeds.

Done when: that test passes · an SQL test creates two cities in different time zones and currencies and shows each
game's local start time and price formatted correctly · a paused city's games are invisible to players ·
`npm run check`, `npm run test:db` exit 0.

### Phase 3 — Roles

1. `public.city_roles`: (`player_id`, `city_id`, `role` = `manager` | `organiser`). `players.is_admin` stays as
   **platform admin**. `players.is_organizer` is replaced by a city role.
2. Two SQL helpers used by every admin RPC: `can_manage_city(city_id)` (platform admin, or manager of it) and
   `can_run_game(game_id)` (the above, or the organiser of that game). Restate every `admin_*` RPC to call one of
   them instead of checking `is_admin`.
3. Scope: a manager reads and writes only their cities (games, venues, prices, players **who booked in their
   city** — nickname, level and phone, never email; the phone read goes through one RPC that checks the role on
   every call, so it stops the moment the role is revoked). An organiser sees nicknames and levels only. An organiser
   reads and writes only games they run. Nobody below platform admin can export players.
4. Invitations: `invite_city_manager(city, email)` (platform admin) and `invite_organiser(city, email)` (manager).
   The role starts when the invited person signs in. `revoke_city_role` ends access at once and keeps all history.
5. Applications: a public "Run Playco in your city" form writes `city_applications` (name, city, sport, contact,
   current games per week). Platform admin approves → creates the city as `draft` and sends the invitation.
6. Every grant, revoke and approval is an event.

Done when: SQL suite `roles.sql` passes: manager A cannot read or change anything in city B · an organiser cannot
touch another organiser's game · a revoked manager is refused on the next call, including the phone read · a
manager cannot read the phone of a player who never booked in their city · no role below platform admin can
select `players.email` · an approved application produces a draft city and one pending invitation.

### Phase 4 — Sports per city

1. `public.sports` (key, sort) and `public.city_sports` (`city_id`, `sport`, `enabled`). Toggled by
   `set_city_sport(city, sport, flag)` — manager of that city.
2. `games.sport not null`; `venues.sports text[]`.
3. Per-sport catalogues as SQL functions with TypeScript mirrors in `lib/sports/`: surfaces (volleyball `indoor`,
   `sand`; football `turf`, `grass`, `indoor`; basketball `indoor`, `outdoor`), formats, positions, default length
   (volleyball and basketball 120, football 90). The surface check depends on the sport.
4. `public.player_sports` (`player_id`, `sport`, `skill_level`, `positions`) is the only source of level and
   positions. `players.skill_level` / `positions` are no longer read.
5. New RPC versions with `p_sport`: game create/update, `complete_signup_v3`, `set_player_sport`. Public reads
   return `sport` and never return a game of a disabled sport or a non-live city.

Done when: SQL suite `sports.sql` passes (game without sport refused · volleyball on `turf` refused · a manager of
another city cannot toggle · disabled sport invisible to `anon` · two levels for one player) · TS-vs-SQL catalogue
test passes.

### Phase 5 — Prices, staff seats, venue costs

1. `public.price_rules`: `city_id`, `sport`, optional `surface`, `venue_id`, `min_duration_minutes`,
   `price_minor`, `valid_from`, `valid_to`. `price_for_game(...)` returns the most specific open rule and raises a
   named error when none matches. Both game writers call it; the form's price is read-only. Closing a rule never
   changes an existing game. Managed by the city manager in Admin → Prices.
2. Staff seats: `games.staff_seats` (city default, 3 in Bangkok); `payment_method` gains `staff`;
   `add_staff(game, player)`: a 0-amount confirmed seat, capped, outside the sold capacity, excluded from paid counts.
3. Venue costs per hour (optional per sport and court size), `venues.default_capacity`, in the city's currency.
4. No prices in migrations. The dev seed adds Bangkok volleyball 250, sand 300, 180-minute 300.

Done when: SQL suite `pricing.sql` passes (no rule → named error · sand beats sport rule · closed rule leaves a
game's price · 4th staff seat refused · staff seat takes no paid place · a manager cannot set another city's price).

### Phase 6 — City and sport views (structure only)

1. Routes `app/[city]/[sport]/page.tsx` and `…/games/page.tsx`, validated against live cities and enabled sports.
2. `/`: one live city with one sport → redirect there. Otherwise a picker (city, then sport); a cookie remembers
   the last choice. The cookie is set in a route handler or action, never during render.
3. Header: city switcher and sport switcher, each rendered only when there is more than one choice.
4. `/game/[id]`: sport- and city-specific fields come from the game. Not found for a non-live city or disabled
   sport unless the viewer can manage it.
5. `/my-games`, `/account`: every city and sport, each game labelled. Profile: a level + positions block per sport.
6. Sign-up: home city (preselected from the path) and sports played.
7. Admin: one panel. Platform admin sees a city selector and Admin → Cities (create, status, sports, manager,
   applications). A manager sees their cities. An organiser sees their games. Every list filters by sport.
8. Each game page shows who to contact (the organiser, else the city's support contact).

Done when: `e2e/views.spec.ts` passes locally: one city + one sport → `/` lands on it, no switchers · enabling
football shows the sport switcher and football games only under `/…/football` · adding a second live city shows the
picker · a manager signed in sees only their city in admin.

### Phase 7 — Wallet per currency

HrajFotbal's wallet counts credits as seats at one flat price (`credit_seat_price_*`). Playco's prices vary.

1. A player has one balance per currency. A refunded cancellation returns what was paid for that seat, in that
   currency. Paying from the wallet spends up to the game's price; the rest is paid online in the same checkout.
2. Restate booking, guest, cancel and admin-credit RPCs so none uses a flat seat price. Admin grants are amounts.
3. **Keep the batch columns** (`batch_id`, `expires_at`): passes will come back later as a second kind of balance
   ("N games in city X, sport Y"). Hide `/pass` behind one flag; do not delete its tables or tests.
4. Cancellation credit never expires: remove the 60-day expiry from wallet credit and its cron sweep. Keep the
   expiry machinery for pass batches only (dormant with passes).

Done when: SQL suite `wallet.sql` passes (cancel 300 in time → +300 · 250 game with 300 in wallet → 50 left ·
300 game with 250 → 50 due · late cancel → 0 · credit dated 61 days ago is still spendable · ledger sum = balance per currency · THB balance unusable in a EUR city).

### Phase 8 — Payments

Goal: money always reaches Playllu; the provider and the account are configuration.

1. `lib/payments/providers/`: an interface (`createCheckout`, `parseWebhook`, `refund`) with one implementation,
   `stripe`. `cities.payment_account` selects a configured account; each account has its own key names in env
   (`STRIPE_<ACCOUNT>_SECRET_KEY`, `…_PUBLISHABLE_KEY`, `…_WEBHOOK_SECRET`) and its own list of payment methods
   (`th`: card + PromptPay). Webhook route: `/api/stripe/webhook/[account]`.
2. Checkout in the city's currency. Confirmation only from the webhook. Handle completed, async succeeded, async
   failed, expired; an unpaid session frees the seat for the waitlist.
3. `payment_method`: add `card`, `promptpay`; `qr` and `cash` unused.
4. **Remove cash completely:** the "pay at the court" choice, the unpaid-reservation grace window and its nudge
   and expiry crons, and admin "mark as paid in cash". A player-facing seat is created only by a settled online
   payment or wallet money. Platform admin keeps one escape hatch, `admin_create_booking` (logged, with a reason),
   for fixing mistakes.
5. Real-money refunds: `request_refund(booking, reason)` by the player → approved or declined by the game's
   organiser or the city manager → the provider refund is issued and logged. The wallet remains the default.
6. Stripe test mode only. See §5.

Done when: unit tests cover the four webhook events and the account routing · an SQL test shows an expired session
frees the seat · no RPC callable by a player, organiser or manager can create an unpaid seat · a refund cannot be approved by a manager of another city · `grep -rn "sk_live\|sk_test\|whsec_"`
finds nothing · `npm run check`, `npm run test:db` exit 0.

### Phase 9 — Deals and statements

1. The standard deal is 50% of profit and 50% of a loss; a new city gets it by default. `public.deals`: `city_id`, optional `sport`, `party` (a manager), `share_percent`, `basis` (`profit`),
   `loss_share_percent`, `valid_from`, `valid_to`. Set by platform admin only.
2. Per game, computed in SQL and tested: revenue − venue cost = profit; manager share =
   round(profit × share); losses shared by `loss_share_percent`.
3. `public.payouts`: what Playllu paid a manager (amount, currency, date, note). Recorded by platform admin. The app records payouts; it does not send money.
4. Admin → Statement, per city and month: games, paid seats, revenue, venue costs, profit, manager
   share, already paid, balance owed either way. A manager sees their own; platform admin sees all.
5. The manager's arrangements with their organisers are theirs: an optional per-organiser note and share that only
   feeds the manager's own view.

Done when: SQL suite `statements.sql` passes with the Bangkok figures as the fixture — 9 games, 28,750 THB revenue,
20,400 venue costs, +8,350 profit, 50% → 4,175 — and a loss-making month splits the loss · a manager cannot read
another city's statement or any deal's terms but their own.

### Phase 10 — Recurring games and referral codes

1. The game form (create and edit) has "Repeats weekly". Ticking it creates a `public.game_series` from that
   game (city, sport, venue, weekday, local start time, length, capacity, level, organiser). A daily job keeps the
   next N weeks (a named constant, 4) created and **published**, each priced from the rules at creation.
   Editing a game asks "this game only" or "this and all following"; the second updates the series and the future
   games that have no bookings yet. Unticking stops the series and leaves existing games alone. Cancelling one
   game never stops the series.
2. Referral: `players.referral_code` (unique, short) and `players.referred_by`, captured from `?ref=` at sign-up
   and shown on the profile with a share link. `referral_events` records the first paid game of a referred player.
   No reward logic yet.

Done when: an SQL test generates four weeks from a series with correct local times across a time-zone edge and
does not duplicate on a second run · "this and following" leaves a game with bookings unchanged · stopping a
series creates nothing further · a sign-up with a valid code stores the referrer; an invalid code is ignored;
a player cannot refer themselves.

### Phase 11 — Languages, phone, legal

1. `lib/i18n/th.ts` filled; the key-coverage test passes for `th`. PR marked "needs a Thai speaker's review".
2. Phone default and validation from the city's `phone_country`.
3. WhatsApp share kept; LINE share added.
4. `/privacy`, `/terms`, `/cookies`: one text per **country**, selected by the city; Thailand's drafted (PDPA) and
   marked draft until Jachym approves. The seller named must be the owner of the city's payment account.
5. Emails: Playco sender and wording; English until `players.locale` exists.

Done when: coverage test passes for `th` · a unit test formats `081 234 5678` as `+66 81 234 5678` for a Thai city ·
`/privacy` renders the Thai text for Bangkok and a "not available yet" page for a country with no text.

### Phase 12 — Hosted database and deploy (first phase that needs accounts)

Needs from Jachym: a Supabase project slot, a Vercel project on this repo, Stripe test keys pasted into Vercel.

1. `playco-staging`, region `ap-southeast-1`. Apply every migration; run the suites; fix `get_advisors` findings.
2. Supabase Auth: Site URL and redirect list match `NEXT_PUBLIC_SITE_URL` exactly; Google login; branded templates.
3. Vercel: env variables (Jachym pastes), region `sin1`.
4. Cron: the 5-minute job does not run on Vercel's free plan. Move frequent jobs to Supabase `pg_cron` calling the
   same RPCs. Vercel's free plan is for non-commercial use: Pro before real payments.
5. Stripe test mode: register the webhook; one booking by test card, one by test PromptPay.
6. Through the admin panel, not SQL: create Bangkok, enable volleyball, add venues, prices, Steven and Sofi as
   organisers, the Bangkok deal.

Done when: the deployed site loads `/bangkok/volleyball` · both test bookings reach `confirmed` by webhook · a
cancellation credits the wallet · the Playwright smoke suite passes against the deployment.

### Phase 13 — HQ connection

Here: `supabase/roles/hq_readonly.sql` (SELECT on named columns: cities, games with sport and city, bookings,
ledger, checkout sessions, events, venue costs, price rules, deals, payouts, players without email / phone / auth
id) and `docs/HQ_CONTRACT.md`.
In `playllu/playllu-hq` (separate PR, HQ's rules): `PLAYCO_DB_READONLY_URL`; `src/data/playco-source.ts`; **every
city appears automatically** as a track per city and sport; a cutover date per city; HQ's golden numbers unchanged.

Done when: a database test proves the role cannot read email or phone and cannot write · HQ's checks are green with
a two-city Playco fixture.

### Phase 14 — Pilot
Because there is no cash, a pilot with real players needs real payments. Two steps:
1. **Dry run (test mode):** founders and organisers book and pay every game of one week with Stripe test cards and
   test PromptPay, in parallel with the real WhatsApp sign-ups. HQ compares Playco's numbers with the hand-entered ones.
2. **Soft launch (live keys, needs Jachym's go and the verified Thai Stripe account):** one real game is opened to
   players in Playco only; the others stay on WhatsApp. Widen game by game.

### Phase 15 — Design
The Playco look: tokens, logo, Open Graph card, icons, an accent per sport. No structural change.

### Phase 16 — Launch
Every Bangkok volleyball game in Playco. Live database and live Stripe keys are already in place from the soft
launch; this adds the domain, 3-of-3 approval in HQ, WhatsApp groups point to Playco.

### Phase 17 — The second city (the proof)
On staging, with no code change and no deploy: approve an application → a draft city in another currency and time
zone → the invited manager signs in, enables football, adds a venue, a price and a weekly series → set the city
live → a test player books and pays → the statement shows the manager's share → pause the city.
**If any step needs a developer, the phase that owns it is not finished.** Write the steps up as
`docs/NEW_CITY.md`, the manager's onboarding guide.

---

## 5. Payments across countries (read before Phase 8)

- **Thailand:** a Thai Stripe account (card + PromptPay), under the same Stripe login as the existing account
  (account selector → New account → Thailand). Separate verification, bank account and keys. Test mode works
  without verification.
- **Open before live:** whether Stripe accepts a foreign individual in Thailand without a company, and what happens
  when the company is registered (usually a new account — for the app, three new env values).
- **Europe:** the existing Playllu Stripe account can be linked to European cities as a second payment account.
- **Other countries:** "Playllu controls the cash flow" needs, per country, either a Stripe account Playllu can
  open there, or charging from an existing account in the local currency (cards only, converted at payout), or a
  second provider behind the same interface. Stripe does not serve every country. Decide per city, at application
  time — it is the first question to ask a prospective manager.
- **Paying managers:** recorded in the app, sent by Playllu outside it (bank transfer). Automatic payouts are not
  in scope.
- Tax and legal structure per country are open until a market is validated; the app keeps every amount, currency,
  city and date needed to produce the numbers later.

Sources: Stripe support (Thailand: supported payment methods, required information, accepted documents, FAQ);
Stripe docs (PromptPay, multiple accounts, Organizations).

## 6. Later, deliberately not now

Passes and an unlimited monthly plan · referral rewards · a city's own brand and domain · a second region ·
automatic payouts · LINE / phone login · ratings, chat, team balancing · level enforcement · native apps · China.
Nothing in Phases 0–17 may make any of these harder: when in doubt, keep the column and hide the feature.
