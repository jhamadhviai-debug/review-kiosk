'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push('/dashboard');
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/dashboard`
            : undefined,
      },
    });
    setLoading(false);
    if (!error) {
      setSent(true);
    } else {
      alert('Something went wrong: ' + error.message);
    }
  };

  if (checking) {
    return null;
  }

  return (
    <div className="container">
      <div className="card">
        <div className="brand-mark">⭐</div>
        <span className="hero-eyebrow">FOR LOCAL BUSINESSES</span>
        <h1>Turn happy customers into 5-star reviews</h1>
        <p className="sub">
          One QR code on your counter does the rest — no app to install, no
          staff training needed.
        </p>

        <div className="value-grid">
          <div className="value-card">
            <div className="value-icon">📈</div>
            <div>
              <div className="value-title">Show up higher on Google</div>
              <div className="value-desc">
                A steady stream of fresh reviews is one of the strongest
                signals for local search ranking.
              </div>
            </div>
          </div>
          <div className="value-card">
            <div className="value-icon">🗣️</div>
            <div>
              <div className="value-title">Reviews in any language</div>
              <div className="value-desc">
                Customers simply speak — it's polished into a ready-to-post
                review in seconds, in English.
              </div>
            </div>
          </div>
          <div className="value-card">
            <div className="value-icon">🛡️</div>
            <div>
              <div className="value-title">Protect your reputation</div>
              <div className="value-desc">
                Unhappy visits are routed straight to you privately — never
                posted in public.
              </div>
            </div>
          </div>
        </div>

        <hr className="divider" />

        {sent ? (
          <p>
            Check your email — we sent you a login link. Click it to open your
            dashboard.
          </p>
        ) : (
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Get my QR code — it’s free'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
