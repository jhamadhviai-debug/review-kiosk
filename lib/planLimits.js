// How many AI-personalized reviews each plan gets per calendar month.
// "free" businesses fall back to a simple templated review once they hit
// this number — the app keeps working, it just stops calling the AI.
// Raise/lower this number any time; no other code needs to change.
export const PLAN_LIMITS = {
  free: 30,
  pro: Infinity,
};

export function getLimitForPlan(plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}
