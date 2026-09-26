export async function POST(request) {
  const { businessName, audioBase64, mimeType } = await request.json();
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `You will receive an audio recording of a customer speaking a review for a business called "${businessName}". The customer may be speaking in any language.

Do all of the following:
1. Listen to what they said.
2. Translate it into natural, fluent English word-for-word in meaning — keep their own details, opinions, and tone. Do not invent anything they did not say. If they said very little, keep the personal version short too.
3. Separately, write a polished version: warm, natural, 1-3 sentences, sounding like a genuine happy customer wrote it, in clear English, based on the same details they mentioned. No hashtags, emojis, or marketing language.

Respond with ONLY valid JSON in exactly this shape and nothing else:
{"personalReview": "translated version, in their own words", "aiReview": "the polished version"}`;

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
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType || 'audio/webm',
                    data: audioBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    );
    const data = await res.json();
    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    return Response.json({
      personalReview: parsed.personalReview || '',
      aiReview: parsed.aiReview || 'Great experience, highly recommend!',
    });
  } catch (err) {
    return Response.json({
      personalReview: '',
      aiReview: 'Great experience, highly recommend!',
      error: true,
    });
  }
}
