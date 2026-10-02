# Review Kiosk

Self-serve QR review tool. See setup instructions in the chat, or follow these:

1. Run `supabase-setup.sql` in your Supabase project's SQL Editor.
2. Upload this whole folder to a new GitHub repository.
3. Import that repository into Vercel.
4. In Vercel, add these Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
5. Deploy.
6. In Supabase: Authentication -> URL Configuration -> set Site URL and add
   a Redirect URL matching your live Vercel domain (e.g.
   `https://your-app.vercel.app/**`).
7. Open your live URL, sign up with your email (magic link), create your
   business, and test your QR code.

## Voice review feature

Customers can now tap "Speak your review" on the review page to record a
short voice review in any language. The recording is sent to
`/api/voice-review`, which uses the same `GEMINI_API_KEY` to translate it to
English and also produce a polished version — the customer picks which one
to post. This needs no extra setup beyond the `GEMINI_API_KEY` already in
your Environment Variables, and only works over HTTPS (which Vercel already
provides), since browsers require a secure connection for microphone access.

## Usage limits (Free vs Pro plans)

Each business is either on the `free` or `pro` plan (stored in the
`businesses.plan` column). Free businesses get a monthly allowance of
AI-personalized reviews (set in `lib/planLimits.js`, 30 by default) — once
they use it up, the app doesn't break, it just quietly hands out a simple
templated review instead of calling the AI, until the next month or an
upgrade. This protects your Gemini costs and stops one business from using
up the shared allowance meant for everyone.

To enable this, you need ONE more Environment Variable in Vercel:

- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase: Project Settings -> API Keys ->
  the `service_role` `secret` key (NOT the `anon` `public` one — this one
  must stay secret and is only ever used server-side).

And run `upgrade-usage-limits.sql` once in the Supabase SQL Editor (adds the
`plan` column — safe even though your tables already exist).

To move a business to Pro manually (before payments are wired up), run this
in the Supabase SQL Editor:

```sql
update businesses set plan = 'pro' where slug = 'their-business-slug';
```

## Real payments (Stripe)

Business owners can now click "Upgrade to Pro" on their dashboard, pay
through Stripe Checkout, and their plan flips to `pro` automatically — no
manual work needed.

Run `upgrade-stripe-columns.sql` once in the Supabase SQL Editor (adds two
columns to track each business's Stripe subscription).

Add these Environment Variables in Vercel:

- `STRIPE_SECRET_KEY` — from Stripe: Developers -> API keys -> Secret key
  (use the `sk_test_...` one first, switch to `sk_live_...` when ready for
  real money).
- `STRIPE_PRICE_ID` — from Stripe: Product catalog -> your product -> the
  `price_...` ID under Pricing.
- `STRIPE_WEBHOOK_SECRET` — created in the next step below.

**Setting up the webhook** (tells your app when a payment succeeds):
1. Deploy this code first (so your live URL exists).
2. In Stripe: Developers -> Webhooks -> Add endpoint.
3. Endpoint URL: `https://your-live-url.vercel.app/api/stripe-webhook`
4. Select events to send: `checkout.session.completed` and
   `customer.subscription.deleted`.
5. After creating it, click into the webhook and reveal the **Signing
   secret** (starts with `whsec_...`) — add that as `STRIPE_WEBHOOK_SECRET`
   in Vercel, then redeploy once more.
Testing the kiosk-updates branch.
