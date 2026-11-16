# Connect Playco — Phase F, step by step

For the agent that connects Playco's accounts for Jachym. The code and the database are done (`main`, Supabase project
`playco`). What is left is clicking through Vercel, Supabase and Stripe dashboards, which only a browser can do.

Work through the steps in order. Each step ends with a **Check**; do not start the next step until it passes. If a
check fails, stop and report what you saw.

## Rules

- **Test mode only.** Use the Thai Stripe account's **test mode / sandbox** keys (`sk_test_…`, `pk_test_…`). Never
  touch live keys or live settings.
- **Secrets never pass through chat.** Copy a key from one dashboard and paste it straight into Vercel. Never write a
  key in a message, a file, a commit or a screenshot description.
- **Right accounts only.**
  - Vercel: Jachym's own account (team "jachymthor-5967's projects"). Never "reneomuller-7550's projects", which is
    Oliver's and holds HrajFotbal and HQ.
  - Supabase: the **Playllu** organisation, project **`playco`** (ref `ldjyayedrkwnozcdttdy`). Never the "hrajsport"
    organisation or the `hrajfotbal-staging` project.
  - GitHub: repository `vibethor/playllu-playco`.
- Do not change code. If something needs a code change, stop and report it.
- Ask Jachym before anything that costs money or that these steps do not name.

## Values you will need

| Name | Value |
|---|---|
| Supabase project URL | `https://ldjyayedrkwnozcdttdy.supabase.co` |
| Supabase dashboard | https://supabase.com/dashboard/project/ldjyayedrkwnozcdttdy |
| Vercel project name | `playco` |
| Webhook path | `/api/stripe/webhook` |

---

## Step 1 — Import the repository into Vercel

1. Open https://vercel.com/new, signed in as Jachym. Check the scope selector shows **jachymthor-5967's projects**.
2. Under **Import Git Repository**, if `playllu-playco` is not listed: click **Install** (or **Adjust GitHub App
   Permissions**), choose the **vibethor** GitHub account, grant access to **playllu-playco** (selected repositories is
   fine), and return to Vercel.
3. Click **Import** next to `vibethor/playllu-playco`.
4. Set **Project Name** to `playco`. Framework: **Next.js** (detected). Leave root directory, build and install
   commands as they are.
5. Open **Environment Variables** and add each of these, for all environments (Production, Preview, Development):

| Key | Value | Where to copy it from |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ldjyayedrkwnozcdttdy.supabase.co` | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the **anon** (legacy) key, or the **publishable** key `sb_publishable_…` | Supabase → `playco` → Project Settings → API Keys |
| `SUPABASE_SERVICE_ROLE_KEY` | the **service_role** (legacy) key, or the **secret** key `sb_secret_…` | same page; it must differ from the anon key |
| `STRIPE_SECRET_KEY` | `sk_test_…` | Stripe, **Thai account**, test mode → Developers → API keys → Secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` | same page → Publishable key |
| `CRON_SECRET` | a random string, 40+ letters and digits | generate one; do not reuse any other secret |
| `EMAIL_DRY_RUN` | `on` | — |
| `NEXT_PUBLIC_PREVIEW` | `1` | — |

   Use the same pair of Supabase keys: both legacy (anon + service_role) or both new (publishable + secret).
6. Click **Deploy** and wait for it to finish.

**Check:** the deployment shows **Ready**. Write down the production address Vercel shows (e.g.
`https://playco-xxxx.vercel.app`, no trailing slash). Below it is called `<SITE>`. Open `<SITE>` in the browser: the
page loads and shows the bar "Preview — test payments only. No real money is taken."

## Step 2 — Tell the site its own address

1. Vercel → project `playco` → Settings → Environment Variables → add `NEXT_PUBLIC_SITE_URL` = `<SITE>` for all
   environments.
2. Deployments → the latest production deployment → **⋯ → Redeploy** (without the build cache is fine).

**Check:** the redeploy is **Ready**, and `<SITE>/robots.txt` mentions `<SITE>`, not another address.

## Step 3 — Supabase login settings

1. Supabase → `playco` → **Authentication → URL Configuration**.
2. **Site URL** = `<SITE>` exactly.
3. **Redirect URLs** → add `<SITE>/**`. Save.
4. **Authentication → Sign In / Providers → Email**: email sign-in enabled. If there is an "Email OTP length" setting,
   set it to **6**.
5. **Authentication → Emails → Templates** (or Email Templates): in both **Magic Link** and **Confirm signup**,
   replace "HrajFotbal" or "Hraj Fotbal" with "Playco" if present. The templates must keep the `{{ .Token }}` and
   `{{ .TokenHash }}` placeholders that `docs/upstream/AUTH_EMAIL_TEMPLATE.md` describes, so both the six-digit code and
   the link work. If you are unsure, leave the template body unchanged and only change the subject line.

**Check:** the Site URL field reads exactly `<SITE>`, and `<SITE>/**` is in the redirect list.

## Step 4 — Stripe (Thai account, test mode)

1. Switch the Stripe dashboard to the **Thai account** and **test mode** (sandbox).
2. **Settings → Payment methods**: make sure **Cards** and **PromptPay** are both turned on.
3. **Developers → Webhooks → Add endpoint** (or "Add destination"):
   - Endpoint URL: `<SITE>/api/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`, `checkout.session.expired`
   - Save, then reveal the endpoint's **Signing secret** (`whsec_…`).
4. Vercel → `playco` → Settings → Environment Variables → add `STRIPE_WEBHOOK_SECRET` = that signing secret, for all
   environments.
5. Redeploy the latest production deployment, as in step 2.

**Check:** the webhook endpoint exists in **test mode** on the Thai account with the four events, and the redeploy is
**Ready**.

## Step 5 — Jachym's account becomes admin

1. Jachym opens `<SITE>`, signs up with his own email, enters the six-digit code from the email, and completes the
   profile (nickname, terms).
   - Supabase's built-in email only delivers to members of the Supabase organisation. Jachym is the owner, so his
     email works; anyone else needs a custom email sender first (`TODO.md`).
2. Supabase → `playco` → **SQL Editor**, run, with Jachym's email in place of the placeholder:

   ```sql
   update public.players set is_admin = true where lower(email) = lower('JACHYMS_EMAIL_HERE') returning nickname, is_admin;
   ```

**Check:** the query returns exactly one row with `is_admin = true`. Jachym reloads `<SITE>` and sees the **Admin**
entry.

## Step 6 — First venue and first game

In `<SITE>/admin`:

1. **Venues → add**: `Swish Elite 50` (indoor). Then `Asoke` (beach, outdoor). Add a photo, map link and address if
   Jachym has them.
2. **Games → New game**: venue Swish Elite 50, a date at least two days ahead, length **120** minutes, capacity
   **18**. The price prefills **250**; leave it. Publish.

**Check:** `<SITE>/games` lists the game in Bangkok time with the price **250 THB**.

## Step 7 — Test bookings (test money only)

1. In a second browser profile or a private window, sign up a second account. Use a second email Jachym controls and
   that is a member of the Supabase organisation, or book with Jachym's own account.
2. Book the game and pay by **card**: `4242 4242 4242 4242`, any future expiry date, any CVC.
3. Book again (or with a guest) and pay by **PromptPay**: click **Generate QR code**, scan it with a phone camera,
   and on Stripe's test page choose **Authorize** (or **Succeed**).
4. In **My games**, cancel one of the bookings (the game is more than 8 hours away).

**Check:**
- both bookings show as confirmed in **My games** and in Admin → the game's roster;
- Stripe test mode → Developers → Webhooks → the endpoint → recent deliveries show **200** responses;
- after the cancellation the wallet on Profile shows **250 THB** of credit.

## Step 8 — Report back

Send Jachym:
- `<SITE>`;
- the result of every **Check** above (pass or fail, with what you saw on a fail);
- anything you skipped and why.

Do not include any key, secret or password in the report.
