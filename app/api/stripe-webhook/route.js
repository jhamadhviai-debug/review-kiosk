import Stripe from 'stripe';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const signature = request.headers.get('stripe-signature');
  const rawBody = await request.text();

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
      await supabaseAdmin
        .from('businesses')
        .update({
          plan: 'pro',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        })
        .eq('id', businessId);
    }
  }

  // Subscription cancelled/ended -> move this business back to Free.
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    await supabaseAdmin
      .from('businesses')
      .update({ plan: 'free' })
      .eq('stripe_subscription_id', subscription.id);
  }

  return Response.json({ received: true });
}
