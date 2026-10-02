import Link from 'next/link';

export const metadata = { title: 'How to use Review Kiosk' };

// After you upload your video to YouTube, paste its ID here.
// Example: for https://youtu.be/AbC123xyz the ID is AbC123xyz
const VIDEO_ID = '';

const steps = [
  {
    t: 'Step 1: Sign up (1 minute)',
    d:
      'Go to the home page. Type your business name. If your business ' +
      'shows in the list, tap it and your Google review link is filled ' +
      'in for you. If not, paste your Google review link yourself ' +
      '(Google Business Profile, then Ask for reviews, then Copy link). ' +
      'Type your email. Tap Generate my QR code.',
  },
  {
    t: 'Step 2: Save your private link',
    d:
      'You will see your dashboard link. We also email it to you. Save ' +
      'it in your bookmarks and do not share it. Anyone with this link ' +
      'can read your feedback. Lost it? On the home page tap Forgot ' +
      'your link and type your email.',
  },
  {
    t: 'Step 3: Download your QR code',
    d:
      'Open your dashboard. Tap Download QR code. Print it. Put it ' +
      'where customers will see it: the counter, tables, the door or ' +
      'the bill.',
  },
  {
    t: 'Step 4: Test it yourself',
    d:
      'Scan the QR code with your phone. Tap the happy face and try ' +
      'both ways to review. Then try the unhappy face too. Now you ' +
      'know what your customers see.',
  },
  {
    t: 'Step 5: What your customer does',
    d:
      'The customer scans the code and taps a happy or unhappy face. ' +
      'Happy: they speak their review (any language) or use the ' +
      'One-tap review, then tap Post. Google opens and the review is ' +
      'already copied. They paste it and tap Post on Google. Unhappy: ' +
      'they type what went wrong. It goes only to you, never public.',
  },
  {
    t: 'Step 6: See your feedback',
    d:
      'Open your dashboard link. Reviews sent shows how many times ' +
      'customers tapped Post. Private feedback shows how many unhappy ' +
      'messages you got. Read each message under Needs attention. You ' +
      'can see the date and time.',
  },
  {
    t: 'Step 7: Your free trial',
    d:
      'For 15 days customers get AI-written reviews. After that they ' +
      'get a simple review and your QR code keeps working. Tap Upgrade ' +
      'to Pro on your dashboard any time to get AI reviews again.',
  },
  {
    t: 'Need help?',
    d: 'Use the chat button and ask us anything.',
  },
];

export default function Guide() {
  return (
    <div className="container wide">
      <div className="card">
        <div className="brand-mark">📖</div>
        <h1>How to use Review Kiosk</h1>
        <p className="sub">From sign-up to your first review in about 5 minutes.</p>

        {VIDEO_ID && (
          <div
            style={{
              position: 'relative',
              paddingBottom: '56.25%',
              height: 0,
              marginBottom: 20,
            }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${VIDEO_ID}`}
              title="How to use Review Kiosk"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 0,
                borderRadius: 14,
              }}
            />
          </div>
        )}

        {steps.map((s) => (
          <div className="value-card" key={s.t} style={{ marginBottom: 12 }}>
            <div>
              <div className="value-title">{s.t}</div>
              <div className="value-desc">{s.d}</div>
            </div>
          </div>
        ))}

        <Link href="/">
          <button style={{ marginTop: 12 }}>Get started</button>
        </Link>
      </div>
    </div>
  );
}
