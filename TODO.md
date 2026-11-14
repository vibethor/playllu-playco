# TODO — things only Jachym can do

None of these block the build before Phase 10 of `docs/EXECUTION_PLAN.md`.

| # | What | Needed by | Notes |
|---|---|---|---|
| 1 | **Database: decide where `playco-staging` lives and free a slot** | Phase 10 | Supabase allows 2 free projects per person. Either pause/delete one, or put the Playco org on Pro (25 USD/month, covers that org only). Region: Singapore |
| 2 | **Thai Stripe account** | Phase 10 (test keys), Phase 13 (live) | Dashboard → account selector → New account → Thailand. Ask Stripe support whether a foreign individual is accepted and what happens when the company is registered. See plan §5 |
| 3 | Make this repository private | before any secret-adjacent work | Settings → General → Change visibility |
| 4 | Vercel project connected to this repo | Phase 10 | Free plan cannot run the 5-minute cron and is for non-commercial use; Pro at launch |
| 5 | Privacy notice (PDPA) and terms | Phase 8 | The agent drafts; you approve. The seller named must match the Stripe account owner |
| 6 | A Thai speaker to review the translation | Phase 8 | |
| 7 | Decide: does wallet credit expire after 60 days, as in Prague? | Phase 5 | |
| 8 | Decide: does a "pay at the court" booking hold its seat until the game, or expire? | Phase 6 | |
| 9 | Domain | Phase 13 | |
| 10 | Prices, venues, venue costs, organisers | Phase 10 | Entered in the admin panel |
| 11 | Thai accountant: income as an individual before the company exists | before live payments | |
