// Run this ONCE, locally, after applying migrations/add-email-only-redesign.sql
// and before you retire the old /dashboard (magic-link) page. It gives
// every existing business a private dashboard_token + email, and emails
// each owner their new link, so nobody gets stuck on the old login page.
// Safe to re-run — it skips any business that's already migrated.
//
// Usage (from the project root, with your real values):
//   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=xxxx \
//   RESEND_API_KEY=xxxx \
//   EMAIL_FROM="Review Kiosk <hello@yourdomain.com>" \
//   NEXT_PUBLIC_SITE_URL=https://your-live-url.vercel.app \
//   node scripts/backfill-private.mjs

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateToken() {
  return crypto.randomBytes(24).toString('base64url');
}

async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
  });
  if (!res.ok) console.error('Email failed:', await res.text());
}

async function main() {
  const { data: businesses, error } = await supabase.from('businesses').select('*');
  if (error) {
    console.error('Could not load businesses:', error.message);
    return;
  }

  for (const business of businesses || []) {
    if (!business.owner_id) continue; // already a new-flow business

    const { data: existing } = await supabase
      .from('business_private')
      .select('business_id')
      .eq('business_id', business.id)
      .single();
    if (existing) continue; // already migrated

    const { data: userRes, error: userErr } = await supabase.auth.admin.getUserById(
      business.owner_id
    );
    const email = userRes?.user?.email;
    if (userErr || !email) {
      console.log('No email found for', business.name, '- skipping');
      continue;
    }

    const token = generateToken();
    await supabase
      .from('business_private')
      .insert({ business_id: business.id, email, dashboard_token: token });

    const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/${token}`;
    await sendEmail({
      to: email,
      subject: `Your ${business.name} dashboard has a simpler link now`,
      html: `<p>Hi,</p><p>You can now open your dashboard for <strong>${business.name}</strong> with one link — no more email login link needed.</p><p><a href="${dashboardUrl}">${dashboardUrl}</a></p><p>Bookmark it — anyone with this link can see your feedback, so keep it private.</p>`,
    });

    console.log('Migrated', business.name, '->', dashboardUrl);
  }

  console.log('Done.');
}

main();
