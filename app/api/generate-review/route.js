import { checkUsage } from '../../../lib/usageCheck';

function fallbackReview(businessName) {
  return `Had a great experience at ${businessName}, highly recommend!`;
}

export async function POST(request) {
  const { businessName, businessId } = await request.json();

  // Fair-use + cost safety net: if this business is over its monthly
  // allowance, skip the AI call entirely and hand back a simple templated
  // review. The customer's flow keeps working either way.
  if (businessId) {
    const usage = await checkUsage(businessId);
    if (!usage.withinLimit) {
      return Response.json({ review: fallbackReview(businessName) });
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = `Write a warm, natural, 1-2 sentence Google review for a business called "${businessName}". Sound like a genuine happy customer wrote it. Do not use hashtags, emojis, or marketing language.`;

  try {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      fallbackReview(businessName);
    return Response.json({ review: text });
  } catch (err) {
    return Response.json({ review: fallbackReview(businessName) });
  }
}
