import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { getTrialStatus } from '../../../lib/trial';

// The no-login dashboard page can't query Supabase directly for feedback
// (there's no auth.uid() to satisfy the "Owners can view their feedback"
// policy, and business_private has no public policies at all). So the
// dashboard page calls this route instead, which validates the token
// server-side with the service role key.
export async function GET(request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) {
    return Response.json({ error: 'Missing token' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: priv } = await supabaseAdmin
    .from('business_private')
    .select('business_id')
    .eq('dashboard_token', token)
    .single();

  if (!priv) {
    return Response.json({ error: 'Invalid link' }, { status: 404 });
  }

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('id', priv.business_id)
    .single();

  if (!business) {
    return Response.json({ error: 'Invalid link' }, { status: 404 });
  }

  const { data: feedback } = await supabaseAdmin
    .from('feedback')
    .select('*')
    .eq('business_id', priv.business_id)
    .order('created_at', { ascending: false });

  return Response.json({
    business,
    feedback: feedback || [],
    trial: getTrialStatus(business),
  });
}
