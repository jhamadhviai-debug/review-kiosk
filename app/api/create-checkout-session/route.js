import Stripe from 'stripe';

let cachedStripe = null;
function getStripe() {
  if (!cachedStripe) {
    cachedStripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return cachedStripe;
}

export async function POST(request) {
  const { businessId, businessSlug, returnPath } = await request.json();

  // Where to send the owner after Stripe. New no-login dashboards pass
  // their own /dashboard/<token> path; the old login dashboard passes
  // nothing and keeps going to /dashboard exactly as before.
  const safePath =
    typeof returnPath === 'string' && /^\/dashboard\/[A-Za-z0-9_-]{20,80}$/.test(returnPath)
      ? returnPath
      : '/dashboard';

  if (!businessId) {
    return Response.json({ error: 'Missing businessId' }, { status: 400 });
  }

  const origin =
    request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${origin}${safePath}?upgraded=1`,
      cancel_url: `${origin}${safePath}`,
      client_reference_id: businessId,
      metadata: { businessId, businessSlug: businessSlug || '' },
    });
    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
