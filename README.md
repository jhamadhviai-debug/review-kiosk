# Review Kiosk

Self-serve QR review tool. See setup instructions in the chat, or follow these:

1. Run `supabase-setup.sql` in your Supabase project's SQL Editor.
2. Upload this whole folder to a new GitHub repository.
3. Import that repository into Vercel.
4. In Vercel, add these Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
5. Deploy.
6. In Supabase: Authentication -> URL Configuration -> set Site URL and add
   a Redirect URL matching your live Vercel domain (e.g.
   `https://your-app.vercel.app/**`).
7. Open your live URL, sign up with your email (magic link), create your
   business, and test your QR code.

## Voice review feature

Customers can now tap "Speak your review" on the review page to record a
short voice review in any language. The recording is sent to
`/api/voice-review`, which uses the same `GEMINI_API_KEY` to translate it to
English and also produce a polished version — the customer picks which one
to post. This needs no extra setup beyond the `GEMINI_API_KEY` already in
your Environment Variables, and only works over HTTPS (which Vercel already
provides), since browsers require a secure connection for microphone access.
