# TODO — things only Jachym can do

Items 1 and 4 block today's preview (Phase F of `docs/EXECUTION_PLAN.md`). Nothing else blocks the build before Phase 12.

## Accounts

| # | What | Needed by | Notes |
|---|---|---|---|
| 1 | ~~Supabase: Playllu org on Pro~~ **done 16 Nov**; project `playco` (`ldjyayedrkwnozcdttdy`, Singapore) created | — | One project serves every Asian city |
| 2 | ~~Thai Stripe account~~ **done 16 Nov** | — | Test keys go into Vercel (Jachym pastes). Still open: confirm with Stripe support that a foreign individual is accepted for live payments, and what happens when the company is registered |
| 3 | Make the repositories private (`vibethor/playllu-playco`, `reneomuller/hrajfotbalek` is Oliver's) | **low priority** | Settings → General → Change visibility. Kept public for now by choice; no secret is ever committed |
| 4 | **Vercel:** import this repo as project `playco` in your own account (free plan) | Phase F (today) | **Upgrade to Pro (one seat, 20 USD/month) before the first real payment**: the free plan's terms forbid commercial use and only run background jobs daily |
| 5 | Domain | Phase 16 | One domain for every city |

| 6 | **Register the company**; then Vercel Pro, live Stripe keys, live payments | before live payments | Proof of concept runs on test payments until then |

| 7 | Make sure **support@playllu.com** and **privacy@playllu.com** reach you (the site now shows them) | before players use it | |
| 8 | Playco's own **WhatsApp group / Instagram** links (the community panel is hidden until then) | when ready | |
| 9 | **Email for real players:** Supabase's built-in email only reaches your project's team members and is rate-limited. Real sign-ups by email need a custom sender (e.g. Resend) on a domain you own; Google sign-in works without it | before players sign up by email | Steps in `docs/AUTH_EMAILS.md` → "Sender" |
| 10 | **Paste the three Playco auth emails** (English + Thai) into Supabase → Authentication → Emails → Templates: subject and body from `docs/auth-email-templates/` | before players sign up | `docs/AUTH_EMAILS.md` says which file goes where |

## Decisions

| # | Question | Needed by |
|---|---|---|
| 11 | Referral reward (who gets what, when) | after launch |
| 12 | Per new country: how does Playllu take payments there? (the first question for a prospective manager) | each city |

## Content and people

| # | What | Needed by |
|---|---|---|
| 13 | **Terms, privacy and cookies texts — reviewed with your lawyer** (the agent does not draft them). The seller named must be the Stripe account owner | before live payments |
| 14 | A Thai speaker to review the translation (`lib/i18n/th.ts`, marked as machine translation) — site and emails | before launch |
| 18 | **Your own hero photo or video** for the home page (today a CC BY placeholder hall photo with a credit line, `public/hero-default.jpg`) and a default court photo (`public/venue-default.jpg` is a generated navy court motif) | before launch |
| 19 | **Venue photos**: upload in Admin → Venues → edit (the card falls back to the navy court motif without one) | before launch |
| 15 | Prices, venues, venue costs, organisers, the Bangkok deal — entered in the admin panel | Phase 12 |
| 16 | A written city-manager agreement (profit share, who owns the players, what needs your approval, how it ends) | before the second city |
| 17 | Thai accountant: income as an individual before the company exists | before live payments |
