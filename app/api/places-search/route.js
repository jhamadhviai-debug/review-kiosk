// Optional: powers the "pick your business from a dropdown" autofill on
// the signup page. If GOOGLE_PLACES_API_KEY isn't set, this quietly
// returns no results and the signup page's manual "paste your review
// link" path is used instead — nothing breaks either way.
export async function GET(request) {
  const query = new URL(request.url).searchParams.get('query');
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey || !query || query.trim().length < 3) {
    return Response.json({ results: [] });
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        query
      )}&key=${apiKey}`
    );
    const data = await res.json();
    const results = (data.results || []).slice(0, 5).map((r) => ({
      placeId: r.place_id,
      name: r.name,
      address: r.formatted_address,
    }));
    return Response.json({ results });
  } catch (err) {
    return Response.json({ results: [] });
  }
}
