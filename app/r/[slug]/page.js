'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// step values:
// choose -> method -> quick | recording -> processing -> versions -> done
//        -> unhappy -> feedback-done
export default function ReviewPage() {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('choose');

  // quick (one-tap) AI review
  const [reviewText, setReviewText] = useState('');
  const [generating, setGenerating] = useState(false);

  // voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [requestingMic, setRequestingMic] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [micError, setMicError] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // voice results
  const [personalReview, setPersonalReview] = useState('');
  const [aiReview, setAiReview] = useState('');

  // unhappy flow
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

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const logPositiveReview = async (text) => {
    if (!business) return;
    try {
      await supabase.from('feedback').insert({
        business_id: business.id,
        type: 'positive_review',
        message: text,
      });
    } catch (err) {
      // non-blocking — analytics should never interrupt the customer
    }
  };

  // ---------- One-tap AI review ----------
  const handleQuickReview = async () => {
    setStep('quick');
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

  const postQuickReview = () => {
    navigator.clipboard?.writeText(reviewText);
    logPositiveReview(reviewText);
    window.open(business.google_review_link, '_blank');
    setStep('done');
  };

  // ---------- Voice review ----------
  const beginRecording = () => {
    setMicError('');
    setStep('recording');
    startRecording();
  };

  const startRecording = async () => {
    setRequestingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);
        handleRecordingStop(mimeType);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRequestingMic(false);
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      setRequestingMic(false);
      setIsRecording(false);
      setMicError(
        "We couldn't access your microphone. Please allow microphone access and try again, or use the one-tap review instead."
      );
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleRecordingStop = async (mimeType) => {
    setStep('processing');
    try {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const audioBase64 = await blobToBase64(blob);
      const res = await fetch('/api/voice-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: business.name,
          audioBase64,
          mimeType,
        }),
      });
      const data = await res.json();
      setPersonalReview(data.personalReview || '');
      setAiReview(data.aiReview || 'Great experience, highly recommend!');
    } catch (err) {
      setPersonalReview('');
      setAiReview('Great experience, highly recommend!');
    }
    setStep('versions');
  };

  const postVersion = (text) => {
    navigator.clipboard?.writeText(text);
    logPositiveReview(text);
    window.open(business.google_review_link, '_blank');
    setStep('done');
  };

  // ---------- Unhappy / private feedback ----------
  const submitFeedback = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await supabase.from('feedback').insert({
      business_id: business.id,
      type: 'unhappy',
      message,
    });
    setSubmitting(false);
    setStep('feedback-done');
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

  const showHeader = step !== 'done' && step !== 'feedback-done';

  return (
    <div className="container">
      <div className="card">
        {showHeader && (
          <>
            <h1>{business.name}</h1>
            <p className="sub">How was your experience today?</p>
          </>
        )}

        {step === 'choose' && (
          <div className="face-buttons">
            <div className="face-button happy" onClick={() => setStep('method')}>
              🙂
            </div>
            <div className="face-button unhappy" onClick={() => setStep('unhappy')}>
              🙁
            </div>
          </div>
        )}

        {step === 'method' && (
          <div className="method-grid">
            <div className="method-card" onClick={beginRecording}>
              <div className="method-icon">🎙️</div>
              <div>
                <div className="method-title">Speak your review</div>
                <div className="method-desc">
                  Say it in any language — we'll turn it into English for you
                </div>
              </div>
            </div>
            <div className="method-card" onClick={handleQuickReview}>
              <div className="method-icon">✨</div>
              <div>
                <div className="method-title">One-tap review</div>
                <div className="method-desc">
                  Instant, ready-to-post review — no typing or talking
                </div>
              </div>
            </div>
            <button className="secondary" onClick={() => setStep('choose')}>
              Back
            </button>
          </div>
        )}

        {step === 'quick' && (
          <>
            {generating ? (
              <div className="loading-block">
                <div className="spinner" />
                <p>Writing your review…</p>
              </div>
            ) : (
              <>
                <div className="review-box">{reviewText}</div>
                <button onClick={postQuickReview}>Post to Google</button>
                <button className="secondary" onClick={() => setStep('method')}>
                  Back
                </button>
              </>
            )}
          </>
        )}

        {step === 'recording' && (
          <>
            {micError ? (
              <div>
                <p className="record-hint" style={{ color: 'var(--coral)' }}>
                  {micError}
                </p>
                <button onClick={startRecording}>Try again</button>
                <button className="secondary" onClick={handleQuickReview}>
                  Use one-tap review instead
                </button>
              </div>
            ) : requestingMic ? (
              <div className="loading-block">
                <div className="spinner" />
                <p>Requesting microphone access…</p>
              </div>
            ) : (
              <div className="record-wrap">
                <button
                  className={`record-btn ${isRecording ? 'recording' : 'idle'}`}
                  onClick={stopRecording}
                >
                  ⏹
                </button>
                <div className="record-timer">{formatTime(seconds)}</div>
                <p className="record-hint">
                  Tap to stop when you're done speaking
                </p>
              </div>
            )}
          </>
        )}

        {step === 'processing' && (
          <div className="loading-block">
            <div className="spinner" />
            <p>Turning your words into a review…</p>
          </div>
        )}

        {step === 'versions' && (
          <>
            {personalReview && (
              <div className="version-card">
                <span className="version-label personal">Your words</span>
                <div className="version-text">{personalReview}</div>
                <button onClick={() => postVersion(personalReview)}>
                  Post this one
                </button>
              </div>
            )}
            <div className="version-card">
              <span className="version-label ai">Polished version</span>
              <div className="version-text">{aiReview}</div>
              <button onClick={() => postVersion(aiReview)}>
                Post this one
              </button>
            </div>
            <button className="secondary" onClick={() => setStep('method')}>
              Back
            </button>
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
          <>
            <div className="thanks-emoji">🎉</div>
            <div className="thanks-title">Thank you!</div>
            <p className="thanks-sub sub">
              Your review means a lot to {business.name}.
            </p>
          </>
        )}

        {step === 'feedback-done' && (
          <>
            <div className="thanks-emoji">🙏</div>
            <div className="thanks-title">Thanks for letting us know</div>
            <p className="thanks-sub sub">
              The owner has been notified privately and will follow up.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
