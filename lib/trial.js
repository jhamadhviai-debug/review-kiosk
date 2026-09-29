export const TRIAL_DAYS = 15;

// Free businesses get full AI-personalized reviews for TRIAL_DAYS days
// after signup. After that they quietly fall back to a simple templated
// review, forever (not a monthly reset) — until they upgrade. Pro
// businesses are always "active". The QR code and customer flow never
// stop working either way; only which review text they get changes.
export function getTrialStatus(business) {
  const plan = business?.plan || 'free';
  if (plan === 'pro') {
    return { isTrialActive: true, isPro: true, daysLeft: null, trialEndsAt: null };
  }

  const trialEndsAt = new Date(business.created_at);
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);
  const msLeft = trialEndsAt.getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

  return {
    isTrialActive: msLeft > 0,
    isPro: false,
    daysLeft,
    trialEndsAt,
  };
}
