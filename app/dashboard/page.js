'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '../../lib/supabaseClient';
import { getLimitForPlan } from '../../lib/planLimits';

function slugify(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export default function Dashboard() {
  const router = useRouter();
  const qrRef = useRef(null);

  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [reviewLink, setReviewLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUser(data.session.user);

      const { data: businesses } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', data.session.user.id)
        .limit(1);

      if (businesses && businesses.length > 0) {
        setBusiness(businesses[0]);
        const { data: fb } = await supabase
          .from('feedback')
          .select('*')
          .eq('business_id', businesses[0].id)
          .order('created_at', { ascending: false });
        setFeedback(fb || []);
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const createBusiness = async (e) => {
    e.preventDefault();
    setSaving(true);
    const slug = slugify(name);
    const { data, error } = await supabase
      .from('businesses')
      .insert({
        owner_id: user.id,
        name,
        slug,
        google_review_link: reviewLink,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      alert('Could not save: ' + error.message);
      return;
    }
    setBusiness(data);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const upgradeToPro = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          businessSlug: business.slug,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Could not start checkout: ' + (data.error || 'unknown error'));
        setUpgrading(false);
      }
    } catch (err) {
      alert('Could not start checkout. Please try again.');
      setUpgrading(false);
    }
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${business.slug}-qr.png`;
    link.click();
  };

  if (loading) return null;

  const publicUrl =
    typeof window !== 'undefined' && business
      ? `${window.location.origin}/r/${business.slug}`
      : '';

  const positiveCount = feedback.filter((f) => f.type === 'positive_review').length;
  const privateCount = feedback.filter((f) => f.type === 'unhappy').length;
  const attentionFeedback = feedback.filter((f) => f.type === 'unhappy');

  const plan = business?.plan || 'free';
  const limit = getLimitForPlan(plan);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const usedThisMonth = feedback.filter(
    (f) => f.type === 'positive_review' && new Date(f.created_at) >= startOfMonth
  ).length;
  const usagePct =
    limit === Infinity ? 0 : Math.min(100, Math.round((usedThisMonth / limit) * 100));

  return (
    <div className="container">
      <div className="card">
        <div className="top-bar">
          <h1 style={{ fontSize: 20, margin: 0 }}>Dashboard</h1>
          <button
            className="secondary"
            style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}
            onClick={signOut}
          >
            Sign out
          </button>
        </div>

        {!business ? (
          <>
            <p className="sub">
              Set up your business once — this creates your permanent QR code.
            </p>

            <div className="value-grid">
              <div className="value-card">
                <div className="value-icon">📈</div>
                <div>
                  <div className="value-title">Show up higher on Google</div>
                  <div className="value-desc">
                    Fresh, frequent reviews help your local search ranking.
                  </div>
                </div>
              </div>
              <div className="value-card">
                <div className="value-icon">🗣️</div>
                <div>
                  <div className="value-title">No language barrier</div>
                  <div className="value-desc">
                    Customers speak in their own language — it becomes an
                    English review automatically.
                  </div>
                </div>
              </div>
              <div className="value-card">
                <div className="value-icon">🛡️</div>
                <div>
                  <div className="value-title">Complaints stay private</div>
                  <div className="value-desc">
                    Unhappy visits reach only you — never posted publicly.
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={createBusiness}>
              <input
                type="text"
                placeholder="Business name (e.g. Sally's Salon)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Your Google review link"
                value={reviewLink}
                onChange={(e) => setReviewLink(e.target.value)}
                required
              />
              <button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Create my QR code'}
              </button>
            </form>
            <p className="muted" style={{ marginTop: 14 }}>
              Tip: get your Google review link from your Google Business
              Profile → "Ask for reviews" → Copy link.
            </p>
          </>
        ) : (
          <>
            <p className="sub">{business.name}</p>

            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-number">{positiveCount}</div>
                <div className="stat-label">Reviews sent</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{privateCount}</div>
                <div className="stat-label">Private feedback</div>
              </div>
            </div>

            <div className="plan-card">
              <div className="plan-row">
                <span className={`plan-badge ${plan}`}>
                  {plan === 'pro' ? 'PRO PLAN' : 'FREE PLAN'}
                </span>
                <span className="muted">
                  {limit === Infinity
                    ? 'Unlimited reviews'
                    : `${usedThisMonth} / ${limit} this month`}
                </span>
              </div>
              {limit !== Infinity && (
                <div className="plan-bar">
                  <div
                    className="plan-bar-fill"
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
              )}
              {plan !== 'pro' && (
                <>
                  <p className="muted" style={{ marginTop: 8, marginBottom: 10 }}>
                    Once you reach the limit, customers still get a review —
                    just not AI-personalized until next month, or upgrade any
                    time for unlimited.
                  </p>
                  <button onClick={upgradeToPro} disabled={upgrading}>
                    {upgrading ? 'Loading…' : 'Upgrade to Pro'}
                  </button>
                </>
              )}
            </div>

            <div className="qr-wrap" ref={qrRef}>
              <QRCodeCanvas value={publicUrl} size={200} />
            </div>
            <button className="secondary" onClick={downloadQR}>
              Download QR code
            </button>

            <p className="muted" style={{ marginTop: 20 }}>
              Your review page:
            </p>
            <div className="link-box">{publicUrl}</div>

            <p className="muted">
              Print this QR code on your counter, receipt, or table tent —
              every scan gives customers the choice to speak or one-tap a
              review, in their own language.
            </p>

            <h3 style={{ marginTop: 24, marginBottom: 8 }}>Needs attention</h3>
            {attentionFeedback.length === 0 ? (
              <p className="muted">
                Nothing yet — this fills up when a customer taps "Not so
                good".
              </p>
            ) : (
              attentionFeedback.map((f) => (
                <div className="feedback-item" key={f.id}>
                  <div className="type attention">Needs attention</div>
                  <div>{f.message}</div>
                  <div className="date">
                    {new Date(f.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        <p className="muted" style={{ marginTop: 22, textAlign: 'center' }}>
          Need help? Use the chat button in the corner.
        </p>
      </div>
    </div>
  );
}
