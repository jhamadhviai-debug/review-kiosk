import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { sendEmail } from '../../../lib/resend';
import { dashboardLinkEmail } from '../../../lib/emailTemplates';

export async function POST(request) {
  const { email } = await request.json();
  if (!email?.trim()) {
    return Response.json({ error: 'Email is required.' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: rows } = await supabaseAdmin
    .from('business_private')
    .select('business_id, dashboard_token')
    .eq('email', email.trim());

  // Always return the same response whether or not the email matches
  // anything — this stops the form being used to check who has signed up.
  if (rows && rows.length > 0) {
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';
    for (const row of rows) {
      const { data: business } = await supabaseAdmin
        .from('businesses')
        .select('name, slug')
        .eq('id', row.business_id)
        .single();
      if (!business) continue;

      const dashboardUrl = `${origin}/dashboard/${row.dashboard_token}`;
      const { subject, html } = dashboardLinkEmail({
        businessName: business.name,
        dashboardUrl,
        isNew: false,
      });
      try {
        await sendEmail({ to: email.trim(), subject, html });
      } catch (err) {
        console.error('Forgot-link email failed:', err);
      }
    }
  }

  return Response.json({ ok: true });
}
