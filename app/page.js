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
        <h1>Review Kiosk</h1>
        <p className="sub">Get more Google reviews with a simple QR code.</p>

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
              {loading ? 'Sending…' : 'Send me a login link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
