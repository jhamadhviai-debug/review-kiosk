import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getTrialStatus } from '../../../../lib/trial';
import { sendEmail } from '../../../../lib/resend';
import { trialEndingEmail, trialEndedEmail } from '../../../../lib/emailTemplates';

// Triggered once a day by Vercel Cron (see vercel.json). Protected by a
// shared secret so it can't be called by anyone who finds the URL.
export async function GET(request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || '';

  const { data: freeBusinesses } = await supabaseAdmin
    .from('businesses')
    .select('id, name, slug, created_at, plan')
    .eq('plan', 'free');

  let endingSent = 0;
  let endedSent = 0;

  for (const business of freeBusinesses || []) {
    const trial = getTrialStatus(business);

    const { data: priv } = await supabaseAdmin
      .from('business_private')
      .select('email, dashboard_token, trial_ending_email_sent, trial_ended_email_sent')
      .eq('business_id', business.id)
      .single();
    if (!priv) continue; // old-flow business with no email on file yet

    const dashboardUrl = `${origin}/dashboard/${priv.dashboard_token}`;

    // 2 days (or fewer) left, and we haven't warned them yet.
    if (trial.isTrialActive && trial.daysLeft <= 2 && !priv.trial_ending_email_sent) {
      const { subject, html } = trialEndingEmail({
        businessName: business.name,
        dashboardUrl,
        daysLeft: trial.daysLeft,
      });
      const result = await sendEmail({ to: priv.email, subject, html });
      if (result.ok) {
        await supabaseAdmin
          .from('business_private')
          .update({ trial_ending_email_sent: true })
          .eq('business_id', business.id);
        endingSent++;
      }
    }

    // Trial just ended, and we haven't told them yet.
    if (!trial.isTrialActive && !priv.trial_ended_email_sent) {
      const { subject, html } = trialEndedEmail({
        businessName: business.name,
        dashboardUrl,
      });
      const result = await sendEmail({ to: priv.email, subject, html });
      if (result.ok) {
        await supabaseAdmin
          .from('business_private')
          .update({ trial_ended_email_sent: true })
          .eq('business_id', business.id);
        endedSent++;
      }
    }
  }

  return Response.json({ ok: true, endingSent, endedSent });
}
