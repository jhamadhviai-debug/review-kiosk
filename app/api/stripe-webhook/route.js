import Stripe from 'stripe';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

let cachedStripe = null;
function getStripe() {
  if (!cachedStripe) {
    cachedStripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return cachedStripe;
}

export async function POST(request) {
  const signature = request.headers.get('stripe-signature');
  const rawBody = await request.text();
  const stripe = getStripe();
  const supabaseAdmin = getSupabaseAdmin();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response('Webhook signature verification failed.', {
      status: 400,
    });
  }

  // Payment succeeded -> move this business to Pro (no more monthly cap).
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const businessId = session.client_reference_id || session.metadata?.businessId;
    if (businessId) {
      const { error, data } = await supabaseAdmin
        .from('businesses')
        .update({
          plan: 'pro',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        })
        .eq('id', businessId)
        .select();

      if (error) {
        console.error('Failed to upgrade business to pro:', businessId, error);
      } else if (!data || data.length === 0) {
        console.error('Upgrade update matched 0 rows for businessId:', businessId);
      }
    } else {
      console.error('checkout.session.completed had no businessId in client_reference_id or metadata', session.id);
    }
  }

  // Subscription cancelled/ended -> move this business back to Free.
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const { error, data } = await supabaseAdmin
      .from('businesses')
      .update({ plan: 'free' })
      .eq('stripe_subscription_id', subscription.id)
      .select();

    if (error) {
      console.error('Failed to downgrade business to free:', subscription.id, error);
    } else if (!data || data.length === 0) {
      console.error('Downgrade update matched 0 rows for subscription:', subscription.id);
    }
  }

  return Response.json({ received: true });
}
