import { getSupabaseAdmin } from './supabaseAdmin';
import { getLimitForPlan } from './planLimits';

// Checks how many AI-personalized reviews this business has used so far
// this calendar month, against their plan's limit.
// Returns { withinLimit, plan, used, limit }.
export async function checkUsage(businessId) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('plan')
    .eq('id', businessId)
    .single();

  const plan = business?.plan || 'free';
  const limit = getLimitForPlan(plan);

  if (limit === Infinity) {
    return { withinLimit: true, plan, used: 0, limit };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabaseAdmin
    .from('feedback')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('type', 'positive_review')
    .gte('created_at', startOfMonth.toISOString());

  const used = count || 0;
  return { withinLimit: used < limit, plan, used, limit };
}
