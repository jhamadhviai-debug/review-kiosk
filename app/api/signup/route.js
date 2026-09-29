import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { generateToken } from '../../../lib/token';
import { sendEmail } from '../../../lib/resend';
import { dashboardLinkEmail } from '../../../lib/emailTemplates';

function slugify(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function POST(request) {
  const { name, email, reviewLink } = await request.json();

  if (!name?.trim() || !email?.trim() || !reviewLink?.trim()) {
    return Response.json(
      { error: 'Business name, email, and review link are all required.' },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const slug = slugify(name);

  // No owner_id — this business isn't tied to a Supabase Auth user.
  // (Needs `alter column owner_id drop not null` from the migration.)
  const { data: business, error: businessError } = await supabaseAdmin
    .from('businesses')
    .insert({ name: name.trim(), slug, google_review_link: reviewLink.trim() })
    .select()
    .single();

  if (businessError) {
    return Response.json(
      { error: 'Could not create your business: ' + businessError.message },
      { status: 500 }
    );
  }

  const token = generateToken();
  const { error: privateError } = await supabaseAdmin.from('business_private').insert({
    business_id: business.id,
    email: email.trim(),
    dashboard_token: token,
  });

  if (privateError) {
    // Roll back the business row rather than leaving an orphaned,
    // un-owned business with no way to reach its dashboard.
    await supabaseAdmin.from('businesses').delete().eq('id', business.id);
    return Response.json(
      { error: 'Could not finish signup: ' + privateError.message },
      { status: 500 }
    );
  }

  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';
  const dashboardUrl = `${origin}/dashboard/${token}`;
  const publicUrl = `${origin}/r/${slug}`;

  // Best-effort — the person already sees the link on screen either way,
  // so an email hiccup should never block signup.
  try {
    const { subject, html } = dashboardLinkEmail({
      businessName: business.name,
      dashboardUrl,
      isNew: true,
    });
    await sendEmail({ to: email.trim(), subject, html });
  } catch (err) {
    console.error('Signup email failed:', err);
  }

  return Response.json({ dashboardUrl, publicUrl, slug: business.slug });
}
