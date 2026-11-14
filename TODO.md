# TODO — things only Jachym can do

None of these block the build before Phase 12 of `docs/EXECUTION_PLAN.md`.

## Accounts

| # | What | Needed by | Notes |
|---|---|---|---|
| 1 | **Database: free a Supabase slot for `playco-staging`** | Phase 12 | 2 free projects per person. Pause/delete one, or put the Playco org on Pro (25 USD/month, that org only). Region: Singapore. One database serves every city in the region |
| 2 | **Thai Stripe account** | Phase 12 (test keys), 16 (live) | Account selector → New account → Thailand. Ask Stripe support: is a foreign individual accepted, and what happens when the company is registered? |
| 3 | Make this repository private | soon | Settings → General → Change visibility |
| 4 | Vercel project on this repo | Phase 12 | Pro before real payments (free plan is non-commercial) |
| 5 | Domain | Phase 16 | One domain for every city |

## Decisions

| # | Question | Needed by |
|---|---|---|
| 6 | Does wallet credit expire after 60 days, as in Prague? | Phase 7 |
| 7 | Does a "pay at the court" booking hold its seat until the game, or expire? Is cash allowed in every city? | Phase 8 |
| 8 | The standard city-manager deal: what share of profit, and what share of a loss? | Phase 9 |
| 9 | Does a manager see their players' phone numbers, or only nicknames? | Phase 3 |
| 10 | Recurring games: created as drafts for the manager to publish, or published automatically? | Phase 10 |
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
