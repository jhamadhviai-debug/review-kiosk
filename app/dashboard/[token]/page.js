'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import WhatsAppButton from '../../components/WhatsAppButton';
export default function TokenDashboard() {
  const { token } = useParams();
  const qrRef = useRef(null);

  const [business, setBusiness] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [trial, setTrial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/dashboard-data?token=${encodeURIComponent(token)}`);
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setBusiness(data.business);
        setFeedback(data.feedback);
        setTrial(data.trial);
      } catch (err) {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const upgradeToPro = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          businessSlug: business.slug,
          returnPath: `/dashboard/${token}`,
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

  if (notFound || !business) {
    return (
      <div className="container">
        <div className="card">
          <h1>Link not found</h1>
          <p className="sub">
            This dashboard link doesn't match a business. If you lost your
            link, go back to the home page and use "Forgot your link?".
          </p>
        </div>
      </div>
    );
  }

  const publicUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/r/${business.slug}` : '';
  const positiveCount = feedback.filter((f) => f.type === 'positive_review').length;
  const attentionFeedback = feedback.filter((f) => f.type === 'unhappy');

    return (
    <div className="container">
      <WhatsAppButton />
      <div className="card">
        <h1 style={{ fontSize: 20, margin: 0 }}>Dashboard</h1>
        <p className="sub">{business.name}</p>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-number">{positiveCount}</div>
            <div className="stat-label">Reviews sent</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{attentionFeedback.length}</div>
            <div className="stat-label">Private feedback</div>
          </div>
        </div>

        <div className="plan-card">
          <div className="plan-row">
            <span className={`plan-badge ${trial.isPro ? 'pro' : 'free'}`}>
              {trial.isPro ? 'PRO PLAN' : 'FREE TRIAL'}
            </span>
            {!trial.isPro && (
              <span className="muted">
                {trial.isTrialActive
                  ? `${trial.daysLeft} day${trial.daysLeft === 1 ? '' : 's'} left`
                  : 'Trial ended'}
              </span>
            )}
          </div>
          {!trial.isPro && (
            <>
              <p className="muted" style={{ marginTop: 8, marginBottom: 10 }}>
                {trial.isTrialActive
                  ? 'Full AI-personalized reviews during your trial. After it ends, customers get a simple template instead — your QR code keeps working either way.'
                  : "Your trial has ended. Customers still get a review to post — it uses a simple template now. Upgrade any time for AI-personalized reviews again."}
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

        <p className="muted" style={{ fontSize: 12 }}>
          Bookmark this page — anyone with this link can see your feedback,
          so keep it private.
        </p>

        <h3 style={{ marginTop: 24, marginBottom: 8 }}>Needs attention</h3>
        {attentionFeedback.length === 0 ? (
          <p className="muted">
            Nothing yet — this fills up when a customer taps "Not so good".
          </p>
        ) : (
          attentionFeedback.map((f) => (
            <div className="feedback-item" key={f.id}>
              <div className="type attention">Needs attention</div>
              <div>{f.message}</div>
              <div className="date">{new Date(f.created_at).toLocaleString()}</div>
            </div>
          ))
        )}

                <p className="muted" style={{ marginTop: 22, textAlign: 'center' }}>
          Need help? <a href="/guide">Read the guide</a> or use the chat button.
        </p>
      </div>
    </div>
  );
}
