import Stripe from 'stripe';

let cachedStripe = null;
function getStripe() {
  if (!cachedStripe) {
    cachedStripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      timeout: 20000,
    });
  }
  return cachedStripe;
}

export async function POST(request) {
  const { businessId, businessSlug, returnPath } = await request.json();

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
    // TEMP DEBUG LOGGING - remove once the real cause is found
    console.error('CHECKOUT DEBUG:', {
      name: err.name,
      type: err.type,
      code: err.code,
      message: err.message,
      detail: err.detail,
      raw: err.raw,
    });
    return Response.json({ error: err.message, debugType: err.type || err.name || 'unknown' }, { status: 500 });
  }
}
