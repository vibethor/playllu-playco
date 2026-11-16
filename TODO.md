# TODO — things only Jachym can do

Items 1 and 4 block today's preview (Phase F of `docs/EXECUTION_PLAN.md`). Nothing else blocks the build before Phase 12.

## Accounts

| # | What | Needed by | Notes |
|---|---|---|---|
| 1 | **Supabase:** rename the "Playco" org to "Playllu", upgrade it to Pro, then the builder creates `playco-staging` (Singapore) — **blocks today's preview** | Phase F (today) | 25 USD/month now; ~35 with the live project at launch. One project serves every Asian city |
| 2 | ~~Thai Stripe account~~ **done 16 Nov** | — | Test keys go into Vercel (Jachym pastes). Still open: confirm with Stripe support that a foreign individual is accepted for live payments, and what happens when the company is registered |
| 3 | Make the repositories private (`vibethor/playllu-playco`, `reneomuller/hrajfotbalek` is Oliver's) | **low priority** | Settings → General → Change visibility. Kept public for now by choice; no secret is ever committed |
| 4 | **Vercel:** create a team "Playllu" in your own Vercel account and import this repo as project `playco` | Phase F (today) | Hobby (free) is fine for the test preview; Pro (20 USD/month per member) before real payments. HQ and HrajFotbal live in Oliver's personal Vercel account today |
| 5 | Domain | Phase 16 | One domain for every city |

## Decisions

| # | Question | Needed by |
|---|---|---|
| 11 | Referral reward (who gets what, when) | after launch |
| 12 | Per new country: how does Playllu take payments there? (the first question for a prospective manager) | each city |

## Content and people

| # | What | Needed by |
|---|---|---|
| 13 | Privacy notice (PDPA) and terms — agent drafts, you approve. The seller named must be the Stripe account owner | Phase 11 |
| 14 | A Thai speaker to review the translation | Phase 11 |
| 15 | Prices, venues, venue costs, organisers, the Bangkok deal — entered in the admin panel | Phase 12 |
| 16 | A written city-manager agreement (profit share, who owns the players, what needs your approval, how it ends) | before the second city |
| 17 | Thai accountant: income as an individual before the company exists | before live payments |
