# CLAUDE.md — Playco

**Playllu** is the platform: one codebase, one database per region, many cities, many team sports (volleyball,
football, basketball). **Playco** is the brand players see. The first launch is Bangkok volleyball; the second city
must be a row in the database and an invitation to a city manager, not a new project.

It is a fork of the HrajFotbal app (see `UPSTREAM.md`), which stays a separate app. It reports into Playllu HQ
through a read-only role.

Next.js App Router + Supabase (Postgres, RLS, plpgsql RPCs) + Vercel + Stripe.

Read this file before every task. **The build order is `docs/EXECUTION_PLAN.md`** — work its phases in order, one
pull request each; what only Jachym can do is in `TODO.md`. HrajFotbal's original `CLAUDE.md` is in
`docs/upstream/CLAUDE.hrajfotbal.md`: its rules and its "lessons, in the order they hurt" apply here unchanged unless
this file says otherwise. Read it once.

---

## 1. Hard rules

1. **Staging first.** Build and verify against the staging Supabase project. Live only at the launch gate.
2. **Jachym approves every change** (code, schema, Stripe, launch). Going live to players also needs 3-of-3 in HQ
   Approvals.
3. **Every state change is a `SECURITY DEFINER` plpgsql RPC** with `search_path = ''`; no client writes; authorization
   inside the function; every table that permits a read grants it explicitly.
4. **Nothing assumes a place.** No city, country, currency, time zone, language or phone prefix literal in `app/`,
   `components/`, `lib/` or a new migration. They come from the city row. A test enforces it.
5. **Money is an integer in the currency's smallest unit plus a currency code.** Two currencies are never added or
   compared. A price is a function of price rules, never a typed number.
6. **Four roles, checked in the database:** platform admin › city manager › organiser › player. A manager reaches
   only their cities; an organiser only their games. A manager sees the phone numbers of players who booked
   in their city while they hold the role; email never leaves platform admin.
7. **Money always goes to Playllu**, through the payment account the city is linked to. Managers and organisers are
   paid a share; the app records payouts and never sends money.
8. **Players belong to Playllu.** Revoking a role ends access and keeps all history. No export below platform admin.
9. **Secrets** are never printed, committed or pasted into chat. Jachym pastes values into Vercel. Every variable is
   in `.env.example`.
10. **Stripe:** test mode until the launch gate. Any change to a live Stripe account needs Jachym.
11. **HQ reads, never writes** (`supabase/roles/hq_readonly.sql`, named columns, no email / phone / auth ids).
12. **Policy windows are values in `lib/policy.ts`.** Cancel any time; refund to the wallet up to the cutoff.
13. **Keep the column, hide the feature.** Passes, subscriptions, referral rewards and city brands come later;
    nothing built now may make them harder.

## 2. Stop and ask

Stop and ask Jachym before you: touch a secret or add an env variable; change Stripe; connect to the live database;
change a business rule below; find a design gap; send anything to players; add a paid service.

## 3. Business rules

Platform:
- **Cancellation:** any time; refund to the wallet up to 8 hours before the start. No-shows keep nothing. A
  real-money refund is requested by the player and approved by the organiser or the city manager.
- **No cash.** Players prepay online (or from the wallet); a seat exists only once it is paid. Staff seats are free.
- **Wallet credit** from a cancellation never expires. A purchased game pass expires 60 days after purchase.
- **Staff logins** (managers, organisers) are created by Playllu, with a limited view. They work in Playco's admin
  panel at launch and in Playllu HQ later (plan Phase 18): keep admin logic in RPCs and query modules, not components.
- **Levels** are shown, not enforced. **No passes** at launch. **Referral code** per player, recorded at sign-up;
  no reward yet.
- **City managers** are invited or approved by Playllu and paid a profit share: 50% of profit and 50% of a loss as standard. They
  may bring their own organisers. Big decisions are discussed with Playllu; day-to-day growth is theirs.
- **Support** is the organiser's, then the city manager's.
- **Recurring games:** "repeats weekly" on the game form; following weeks are created and published automatically.
- **Login:** email, password, Google. Web app, installable.

Bangkok (the first city — these are data, entered in admin, listed here so the agent can seed a dev database):
- THB · Asia/Bangkok · English (default) and Thai · +66 · Thai PDPA.
- Volleyball 250 THB, beach 300; the Sunday Swish game (3 h, 17:00–20:00, intermediate / advanced) 300.
  Regular games 2 h. 3 free staff seats a game (Steven, Sofi, Jay). Capacity Swish 18, Asoke 15.
- Venue costs per hour: Swish Elite 50 volleyball 1,000, basketball 1,200 full / 600 half · Swish 56 basketball
  1,200 / 600 · Pachyderm 1,500 · Cruzeiro 1,200 · Asoke (beach, outdoor) 1,200. Must agree with HQ's
  `src/data/seed/reference.ts`.
- Organisers: Steven (hard-court volleyball), Sofi (beach volleyball), Jachym (basketball).
- Deal: volleyball 50% of profit, losses split 50/50. Reference month 11 Oct–8 Nov: 9 games, 28,750 revenue,
  20,400 venues, +8,350 profit, 4,175 share.
- Payments: Thai Stripe account (card + PromptPay).

## 4. Running it

```
npm install
npm run dev
npx tsc --noEmit && npx vitest run      # types + unit tests
```
Database tests on a throwaway local Postgres (no Docker): apply `supabase/local/supabase_shim.sql`, then
`supabase/migrations/*.sql` in order, then run `supabase/tests/*.sql` and read each summary row. Known local gaps:
`notifications.sql` needs pgTAP; `ledger_invariant.sql` needs a seeded player; `profile_photos.sql` #14 depends on
Supabase's real storage service. Phase 0 of the plan turns this into `npm run test:db`.
