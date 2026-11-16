# Supabase auth emails (Playco) — what to paste

Supabase sends three emails itself: sign-in, confirm signup and change of email. Their HTML is built in this repo
from the same layout and strings as every other Playco email (`lib/email/templates/authEmails.ts`), in English and
Thai, and pasted into the Supabase dashboard by hand.

```bash
npm run email:auth-templates
```

writes six files to `docs/auth-email-templates/`. In Supabase → **Authentication → Emails → Templates**
(project `playco`):

| Dashboard template | Subject field | Message body |
|---|---|---|
| **Magic Link** | `magic_link.subject.txt` | `magic_link.html` |
| **Confirm signup** | `confirm_signup.subject.txt` | `confirm_signup.html` |
| **Change Email Address** | `email_change.subject.txt` | `email_change.html` |

Paste each file's whole content, including the `{{ ... }}` lines at the top. Those lines pick the language from
the account: the email language chosen at signup or on the account page, else the language the terms were read in,
else English. Accounts with any other language get English.

## Before you paste

- **Site URL** (Authentication → URL Configuration) must be the address players use, today
  `https://playco-ten.vercel.app`. The links in all three emails are `{{ .SiteURL }}/auth/callback?...`, and the
  logo is loaded from `{{ .SiteURL }}/brand/playco-mark-96.png`.
- Keep `{{ .Token }}`, `{{ .TokenHash }}`, `{{ .Email }}` and `{{ .NewEmail }}` exactly as they are. A template that
  looks right but loses one of them sends a link or code that cannot be used.
  `lib/email/__tests__/authTemplates.test.ts` checks all of them.

## After you paste

On a real phone, for each language (switch the site to ไทย before signing up to get Thai):

1. Sign up with a new address → the confirm email arrives in that language, the button signs you in.
2. Sign out → "Forgot your password?" → the code email arrives, the six-digit code works.
3. Account → change email → both addresses get the notice, naming both.

## Sender (TODO, not done)

Until custom SMTP is set, Supabase's built-in mailer sends these emails, and **it only delivers to members of the
Supabase organisation** (with a low hourly limit). Real players will not get sign-up emails until this is done.

When the sending domain is ready, in Authentication → Emails → **SMTP Settings**:

| Field | Value |
|---|---|
| Sender email | `support@playllu.com` (or the Playco domain once bought) |
| Sender name | `Playco` |
| Host / port / user | `smtp.resend.com` / `465` / `resend` |
| Password | a Resend API key, pasted by Jachym |

The domain must be verified in Resend first (DNS records on the domain). The same sender goes into the
`EMAIL_FROM` variable in Vercel for the booking emails.

The Thai text is a machine translation, not yet reviewed by a native speaker (see `lib/i18n/th.ts`).
