# Going live — UNIREAL

This guide takes the app from local/mock mode to a live site with a real
database, accounts, subscriptions, automated emails and a custom domain.

The app keeps working in **mock mode** until you set the env vars below, so you
can do these steps in order without breaking anything.

---

## 1. Supabase (database + auth)

1. Create a project at https://supabase.com → copy from **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (keep secret)
2. In **SQL Editor**, run the migrations in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_profiles_subscriptions.sql`
3. Seed the universities + sample reviews:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run data:seed
   ```
4. **Auth providers** (Supabase → Authentication → Providers):
   - Email: enable.
   - Google: enable and paste a Google OAuth client ID/secret. Add the Supabase
     callback URL it shows to your Google Cloud OAuth consent screen.
   - Under **URL Configuration**, set Site URL to your domain and add it to the
     redirect allow-list.
5. Set `NEXT_PUBLIC_DATA_SOURCE=supabase`.

The admin email (`emadcomircom@gmail.com`) is seeded in `admin_emails`. To change
admins, edit that table or set `ADMIN_EMAILS`.

## 2. Stripe (subscriptions)

1. Create a **Product** + recurring **Price** (e.g. UNIREAL Pro, monthly) →
   copy the price id into `STRIPE_PRICE_ID`.
2. Copy `STRIPE_SECRET_KEY` (Developers → API keys).
3. Add a **webhook** (Developers → Webhooks) pointing to
   `https://YOURDOMAIN/api/stripe/webhook`, subscribing to:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`.
   Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Enable the **Customer Portal** (Settings → Billing → Customer portal) so the
   "Manage subscription" button works.

Locally you can test with the Stripe CLI:
`stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## 3. Resend (emails) + expiry cron

1. Create an API key → `RESEND_API_KEY`.
2. Verify your sending domain, then set `EMAIL_FROM`,
   e.g. `UNIREAL <noreply@yourdomain>`.
3. Set a random `CRON_SECRET`.
4. The daily job is defined in `vercel.json`
   (`/api/cron/expiring-subscriptions`, 09:00 UTC). Vercel Cron calls it with
   the `CRON_SECRET` as a Bearer token and it emails users whose Pro plan ends
   within 5 days (once per period).

## 4. Vercel (hosting) + domain

1. Push to GitHub and import the repo at https://vercel.com/new.
2. Add **all** env vars from `.env.example` in Vercel → Settings →
   Environment Variables (set `NEXT_PUBLIC_SITE_URL` to your real domain).
3. Deploy.
4. **Domain**: buy it (Namecheap/Cloudflare/etc.), then Vercel → Settings →
   Domains → add it and follow the DNS records shown (A/CNAME). Once it
   verifies, update `NEXT_PUBLIC_SITE_URL` and the Supabase Site URL + Stripe
   webhook URL to the new domain, and redeploy.

## 5. Smoke test (live)

- Sign up / sign in (email + Google).
- Subscribe (use a Stripe test card `4242 4242 4242 4242`), confirm the webhook
  flips your plan to **Pro** on `/auth`.
- Visit `/admin` as `emadcomircom@gmail.com` → see members + subscriptions.
- Trigger the cron manually:
  `curl "https://YOURDOMAIN/api/cron/expiring-subscriptions?secret=CRON_SECRET"`.

---

### What's still placeholder
- The chat assistant and the per-university "fresh data" provider are wired as
  seams (`lib/chat/assistant.ts`, `lib/data/ai-provider.ts`). Plug in the Claude
  API there when ready — no UI changes needed.
