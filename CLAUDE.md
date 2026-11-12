# CLAUDE.md — Playco

Playco is Playllu's booking web app for pickup games in Bangkok: **football, volleyball and basketball**. It replaces
the WhatsApp groups. It is a fork of the HrajFotbal app (see `UPSTREAM.md`) with its own database, deploy and accounts,
and it reports into Playllu HQ through a read-only role.

Next.js App Router + Supabase (Postgres, RLS, plpgsql RPCs) + Vercel + Stripe (Thai account, THB, PromptPay + card).

Read this file before every task. HrajFotbal's original `CLAUDE.md` is in `docs/upstream/CLAUDE.hrajfotbal.md`: its
rules and its "lessons, in the order they hurt" apply here unchanged unless this file says otherwise. Read it once.

---

## 1. Hard rules

1. **Staging first.** Build and verify against the staging Supabase project. Live only at the launch gate.
2. **Jachym approves every change** to Playco (code, schema, Stripe, launch). Going live to players also needs 3-of-3
   in HQ Approvals.
3. **Every state change is a `SECURITY DEFINER` plpgsql RPC** with `search_path = ''`; no client writes; authorization
   inside the function; every table that permits a read grants it explicitly (Supabase grants nothing by default here).
4. **Secrets** are never printed, committed or pasted into chat. Jachym pastes values into Vercel. Every variable is in
   `.env.example`.
5. **Stripe:** test mode until the launch gate. Any change to the live Stripe account needs Jachym.
6. **HQ reads, never writes.** The `hq_readonly` role (`supabase/roles/hq_readonly.sql`) gets SELECT on named columns —
   never email, phone or auth ids. A column drop that HQ selects is a change to HQ too.
7. **Money is THB, integer baht.** The price is a function (`price_for_game`), never a typed number — not in a form,
   a constant or a CHECK constraint.
8. **Policy windows are values in `lib/policy.ts`.** Same cancellation rule as HrajFotbal: cancel any time; refund to
   the wallet up to the refund cutoff.

## 2. Stop and ask

Stop and ask Jachym before you: touch a secret or add an env variable; change Stripe; connect to the live database;
change a business rule below; find a design gap; send anything to players.

## 3. Business rules (Bangkok)

- **Sports:** football, volleyball, basketball. Every game has `sport`; volleyball also `surface` (indoor / beach).
- **Prices:** volleyball 250 THB, beach 300; the Sunday Swish game (3 h, 17:00–20:00, intermediate / advanced) 300.
  Football and basketball prices: to be set by Jachym.
- **Length:** regular games 2 h; Sunday Swish 3 h.
- **Staff seats:** 3 free seats a game (Steven, Sofi, Jay): 0 THB, not a paid visit.
- **Capacity:** Swish 18, Asoke 15 (venue default, editable per game).
- **Venues** (cost per hour): Swish Elite 50 volleyball 1,000 THB, basketball 1,200 full / 600 half · Swish 56
  basketball 1,200 / 600 · Pachyderm 1,500 · Cruzeiro 1,200 · Asoke (beach, outdoor) 1,200. The same values live in
  HQ's `src/data/seed/reference.ts`; they must agree.
- **Organisers:** Steven (hard-court volleyball), Sofi (beach volleyball from 10 Nov), Jachym (basketball). An organiser
  sees and manages only their own games.
- **Payments:** Stripe (Thai account) — card and PromptPay, in THB. Cash at the court, confirmed by the organiser.
- **No passes** at the start. The wallet (cancellation credit) stays.
- **Languages:** English (default) and Thai.
- **Phone:** +66 default. **Time zone:** Asia/Bangkok.
- **Privacy:** Thai PDPA.

## 4. Running it

```
npm install
npm run dev
npx tsc --noEmit && npx vitest run      # types + unit tests
```
Database tests on a throwaway local Postgres (no Docker): apply `supabase/local/supabase_shim.sql`, then
`supabase/migrations/*.sql` in order, then run `supabase/tests/*.sql` and read each summary row. Known local gaps:
`notifications.sql` needs pgTAP; `ledger_invariant.sql` needs a seeded player; `profile_photos.sql` #14 depends on
Supabase's real storage service.
