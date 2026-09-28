import { getSupabaseAdmin } from './supabaseAdmin';
import { getTrialStatus } from './trial';

// Whether this business should get a real AI-personalized review right
// now, or the simple templated fallback.
// - Pro: always yes.
// - Free: yes for the first TRIAL_DAYS days after signup, then no,
//   forever (not a monthly reset like before).
// The customer's flow keeps working either way — this function is only
// ever consulted by generate-review and voice-review, which don't need to
// change at all: they only read `withinLimit`.
export async function checkUsage(businessId) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('plan, created_at')
    .eq('id', businessId)
    .single();

  if (!business) {
    // Fail open: an unknown businessId should never block a customer's
    // review flow.
    return { withinLimit: true, plan: 'free' };
  }

  const { isTrialActive, isPro } = getTrialStatus(business);
  return { withinLimit: isPro || isTrialActive, plan: business.plan || 'free' };
}
