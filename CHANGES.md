# Email-only redesign — what changed

## Untouched — your live app's core stays exactly as-is
- `app/r/[slug]/page.js` — the QR-scan page every printed code points to
- `app/api/generate-review/route.js`
- `app/api/voice-review/route.js`
- `app/api/create-checkout-session/route.js`
- `app/dashboard/page.js` — the OLD magic-link dashboard (kept alive as a
  safety net for any owner who signed up the old way, until you migrate
  and retire it — see Step 6 below)
- `lib/supabaseAdmin.js`, `lib/supabaseClient.js`, `lib/planLimits.js`
- `package.json`, `next.config.mjs`, `app/layout.js`, `app/globals.css`
- `supabase-setup.sql`, `upgrade-stripe-columns.sql`, `upgrade-usage-limits.sql`

No new npm dependencies are needed anywhere — every new file uses `fetch`
and Node's built-in `crypto`, so `package.json` doesn't change and there's
nothing new to install.

## New files
- `migrations/add-email-only-redesign.sql`
- `lib/resend.js`, `lib/token.js`, `lib/trial.js`, `lib/emailTemplates.js`
- `app/api/signup/route.js`
- `app/api/dashboard-data/route.js`
- `app/dashboard/[token]/page.js`
- `app/api/forgot-link/route.js`
- `app/api/places-search/route.js` (optional business-name autofill)
- `app/api/cron/trial-reminders/route.js`
- `vercel.json`
- `scripts/backfill-private.mjs` (run once, locally)

## Modified files (full replacements)
- `app/page.js` — old magic-link box → new one-page signup + forgot-link
- `lib/usageCheck.js` — monthly quota → 15-day trial. Same return shape
  (`{ withinLimit, plan }`), so the two AI routes above needed **zero**
  changes.
- `app/api/stripe-webhook/route.js` — same URL, same two event handlers
  as before, plus one new one for `invoice.payment_failed`.

## Why this can't break what's already live
- **The QR codes already in the wild point at `/r/[slug]`.** That page and
  the two API routes it calls are byte-for-byte unchanged. It doesn't know
  or care that the signup/dashboard flow changed underneath it.
- **The database change is additive.** One new table with RLS locked to
  service-role only, and one constraint *loosened* (`owner_id` becomes
  nullable) — no existing row is touched, updated, or deleted.
- **Old owners keep working.** `app/dashboard/page.js` (session-based) is
  left in place, so anyone who already has that bookmarked doesn't get
  locked out the moment you deploy.

## Rollout order
1. Create a branch (`git checkout -b email-only-redesign`) — don't touch `main`.
2. Run `migrations/add-email-only-redesign.sql` once in Supabase's SQL
   Editor. Safe to run directly on your live project — it changes nothing
   that already exists.
3. Copy these files into the branch, matching the paths above.
4. In Vercel, add these env vars **for the Preview environment first**:
   `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`,
   and optionally `GOOGLE_PLACES_API_KEY`.
5. Push the branch. Vercel builds a Preview URL automatically —
   completely separate from your live `review-kiosk-iota.vercel.app`
   domain. Test the whole flow there: signup → email arrives → dashboard
   loads → QR scan still works → upgrade → forgot-link.
6. If any real businesses already signed up the old way, run
   `scripts/backfill-private.mjs` once (against production Supabase) so
   they get a token + a "your dashboard has a simpler link now" email.
7. Merge to `main`. Vercel deploys to your live domain. Because `/r/[slug]`
   never changed, every already-printed QR code keeps working through and
   after this deploy with no downtime.
8. In Stripe → your existing webhook endpoint → add the
   `invoice.payment_failed` event (same URL, same signing secret).
9. In Vercel → Project → Cron Jobs, confirm the daily job from
   `vercel.json` is registered.
10. Verify your sending domain in Resend (adds SPF/DKIM DNS records) so
    `EMAIL_FROM` doesn't land in spam.
11. Once you're confident no one's using the old login link anymore,
    delete `app/dashboard/page.js` and this note about it.

## Rollback, if anything looks wrong after step 7
Vercel keeps every deployment — go to Deployments, find the one before
this merge, and click "Promote to Production." That's an instant revert.
The new SQL table and the loosened constraint are harmless to leave in
place even if you roll the code back.

## One pre-existing thing worth knowing (not part of this change)
`businesses` has a `select using (true)` RLS policy, which means *any*
column on that table can already be read by anyone with the public anon
key — not just by slug. Nothing new added here (`business_private`) is
exposed this way, but it's worth tightening that policy to explicit
columns at some point, separately from this redesign.
