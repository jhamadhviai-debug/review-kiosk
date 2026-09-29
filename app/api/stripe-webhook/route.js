import Stripe from 'stripe';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { sendEmail } from '../../../lib/resend';
import { paymentIssueEmail } from '../../../lib/emailTemplates';

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

  // Payment succeeded -> move this business to Pro (no more trial limit).
  // UNCHANGED from before.
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
  // UNCHANGED from before.
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    await supabaseAdmin
      .from('businesses')
      .update({ plan: 'free' })
      .eq('stripe_subscription_id', subscription.id);
  }

  // NEW — a renewal payment failed. We only warn the owner by email here;
  // we don't downgrade (Stripe will retry automatically, and
  // customer.subscription.deleted above already handles a final failure).
  // To receive this event, add "invoice.payment_failed" to this same
  // webhook endpoint's selected events in the Stripe dashboard — the URL
  // and signing secret don't change.
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    const customerId = invoice.customer;

    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('id, name')
      .eq('stripe_customer_id', customerId)
      .single();

    if (business) {
      const { data: priv } = await supabaseAdmin
        .from('business_private')
        .select('email, dashboard_token')
        .eq('business_id', business.id)
        .single();

      if (priv) {
        const origin = process.env.NEXT_PUBLIC_SITE_URL || '';
        const dashboardUrl = `${origin}/dashboard/${priv.dashboard_token}`;
        const { subject, html } = paymentIssueEmail({
          businessName: business.name,
          dashboardUrl,
        });
        await sendEmail({ to: priv.email, subject, html });
      }
    }
  }

  return Response.json({ received: true });
}
