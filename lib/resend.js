// SERVER-ONLY. Sends transactional emails via Resend (https://resend.com).
//
// Add to Vercel Environment Variables:
//   RESEND_API_KEY  - from Resend: API Keys -> Create API Key
//   EMAIL_FROM      - e.g. "Review Kiosk <hello@yourdomain.com>". Must be on
//                     a domain you've verified in Resend (Domains -> Add
//                     Domain -> add the DNS records it gives you). Until
//                     you verify a domain, you can test with Resend's
//                     shared "onboarding@resend.dev" sender.
//
// Uses plain fetch, so no new npm package is required — nothing changes
// in package.json or the build.
export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set — email not sent:', subject);
    return { ok: false };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Review Kiosk <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error('Resend error:', await res.text());
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error('Email send failed:', err);
    return { ok: false };
  }
}
