'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function ReviewPage() {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('choose'); // choose | happy | unhappy | done
  const [reviewText, setReviewText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', slug)
        .single();
      setBusiness(data);
      setLoading(false);
    };
    load();
  }, [slug]);

  const handleHappy = async () => {
    setStep('happy');
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: business.name }),
      });
      const data = await res.json();
      setReviewText(data.review);
    } catch (err) {
      setReviewText('Great experience, highly recommend!');
    }
    setGenerating(false);
  };

  const copyAndOpen = () => {
    navigator.clipboard.writeText(reviewText);
    window.open(business.google_review_link, '_blank');
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await supabase.from('feedback').insert({
      business_id: business.id,
      type: 'unhappy',
      message,
    });
    setSubmitting(false);
    setStep('done');
  };

  if (loading) return null;

  if (!business) {
    return (
      <div className="container">
        <div className="card">
          <h1>Not found</h1>
          <p className="sub">This QR code link doesn't match a business.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>{business.name}</h1>
        <p className="sub">How was your experience today?</p>

        {step === 'choose' && (
          <div className="face-buttons">
            <div className="face-button happy" onClick={handleHappy}>
              🙂
            </div>
            <div
              className="face-button unhappy"
              onClick={() => setStep('unhappy')}
            >
              🙁
            </div>
          </div>
        )}

        {step === 'happy' && (
          <>
            {generating ? (
              <p className="muted">Writing your review…</p>
            ) : (
              <>
                <div className="review-box">{reviewText}</div>
                <button onClick={copyAndOpen}>
                  Copy &amp; open Google Reviews
                </button>
                <button className="secondary" onClick={() => setStep('choose')}>
                  Back
                </button>
              </>
            )}
          </>
        )}

        {step === 'unhappy' && (
          <form onSubmit={submitFeedback}>
            <p className="muted">
              Sorry to hear that — tell us what happened, it goes straight to
              the owner, never public.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              placeholder="What went wrong?"
            />
            <button type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send privately'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <p>Thank you — the owner has been notified and will follow up.</p>
        )}
      </div>
    </div>
  );
}
