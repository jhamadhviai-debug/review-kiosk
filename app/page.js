'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import WhatsAppButton from './components/WhatsAppButton';
export default function Home() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reviewLink, setReviewLink] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [editingLink, setEditingLink] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotSending, setForgotSending] = useState(false);

  const debounceRef = useRef(null);

  // Business-name autofill (optional — silently does nothing if
  // GOOGLE_PLACES_API_KEY isn't configured on the server).
  useEffect(() => {
    if (!name || name.trim().length < 3 || reviewLink) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places-search?query=${encodeURIComponent(name)}`);
        const data = await res.json();
        setSuggestions(data.results || []);
      } catch {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [name, reviewLink]);

  const pickSuggestion = (s) => {
    setName(s.name);
    setReviewLink(`https://search.google.com/local/writereview?placeid=${s.placeId}`);
    setSuggestions([]);
    setEditingLink(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, reviewLink }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Something went wrong.');
        setSaving(false);
        return;
      }
      setResult(data);
    } catch (err) {
      alert('Something went wrong. Please try again.');
    }
    setSaving(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotSending(true);
    try {
      await fetch('/api/forgot-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
    } catch (err) {
      // fall through — we show the same message either way
    }
    setForgotSending(false);
    setForgotSent(true);
  };

  if (result) {
    return (
      <div className="container">
        <div className="card">
          <div className="brand-mark">⭐</div>
          <h1>You're all set!</h1>
          <p className="sub">
            We've also emailed this link to you — bookmark it, it's your
            private dashboard key. Anyone with this link can see your
            feedback, so don't share it publicly.
          </p>
          <p className="muted">Your dashboard:</p>
          <div className="link-box">{result.dashboardUrl}</div>
          <a href={result.dashboardUrl}>
            <button style={{ marginTop: 12 }}>Open my dashboard</button>
          </a>
        </div>
      </div>
    );
  }

    return (
    <div className="container">
      <WhatsAppButton />
      <div className="card">
        <div className="brand-mark">⭐</div>
        <span className="hero-eyebrow">FOR LOCAL BUSINESSES</span>
        <h1>Turn happy customers into 5-star reviews</h1>
        <p className="sub">
          One QR code on your counter does the rest — no app to install, no
          staff training needed.
        </p>

        <p className="muted" style={{ marginTop: -6, marginBottom: 18 }}>
          <Link href="/guide">New here? See how it works in 5 steps &rarr;</Link>
        </p>

        <div className="value-grid">
          <div className="value-card">
            <div className="value-icon">📈</div>
            <div>
              <div className="value-title">Show up higher on Google</div>
              <div className="value-desc">
                A steady stream of fresh reviews helps your local search
                ranking.
              </div>
            </div>
          </div>
          <div className="value-card">
            <div className="value-icon">🗣️</div>
            <div>
              <div className="value-title">Reviews in any language</div>
              <div className="value-desc">
                Customers speak — it's polished into an English review in
                seconds.
              </div>
            </div>
          </div>
          <div className="value-card">
            <div className="value-icon">🛡️</div>
            <div>
              <div className="value-title">Protect your reputation</div>
              <div className="value-desc">
                Unhappy visits come to you privately — never posted in
                public.
              </div>
            </div>
          </div>
        </div>

        <hr className="divider" />

        {!showForgot ? (
          <>
            <form onSubmit={handleSignup}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Business name (e.g. Sally's Salon)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                {suggestions.length > 0 && (
                  <div
                    style={{
                      border: '1px solid #eee',
                      borderRadius: 8,
                      marginTop: -8,
                      marginBottom: 12,
                      overflow: 'hidden',
                    }}
                  >
                    {suggestions.map((s) => (
                      <div
                        key={s.placeId}
                        onClick={() => pickSuggestion(s)}
                        style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f2f2f2' }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {s.address}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {reviewLink && !editingLink ? (
                <div className="link-box" style={{ marginBottom: 12 }}>
                  ✓ Review link found —{' '}
                  <span
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setEditingLink(true)}
                  >
                    change it
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Your Google review link"
                  value={reviewLink}
                  onChange={(e) => setReviewLink(e.target.value)}
                  required
                />
              )}

              <button type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Generate my QR code — it’s free'}
              </button>
            </form>

            {!reviewLink && (
              <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
                Can't find your business above? Just paste your Google review
                link in the box instead — from your Google Business Profile →
                "Ask for reviews" → Copy link.
              </p>
            )}

            <p className="muted" style={{ marginTop: 18, textAlign: 'center' }}>
              Already signed up?{' '}
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setShowForgot(true)}
              >
                Forgot your link?
              </span>
            </p>

            <p className="muted" style={{ marginTop: 10, textAlign: 'center' }}>
              <Link href="/guide">How does it work? Read the guide</Link>
            </p>
          </>
        ) : forgotSent ? (
          <p>If that email is on file, we've sent your dashboard link.</p>
        ) : (
          <form onSubmit={handleForgot}>
            <input
              type="email"
              placeholder="The email you signed up with"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={forgotSending}>
              {forgotSending ? 'Sending…' : 'Email me my link'}
            </button>
            <p
              className="muted"
              style={{ textAlign: 'center', marginTop: 10, cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setShowForgot(false)}
            >
              Back
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
