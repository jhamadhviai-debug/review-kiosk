// SERVER-ONLY. Never import this into a 'use client' file or expose
// SUPABASE_SERVICE_ROLE_KEY to the browser — it bypasses all Row Level
// Security. It's only safe here because API routes run on the server.
//
// The client is created lazily (inside a function, not at the top of the
// file) so that a missing environment variable only affects the one
// request that needs it, instead of crashing the whole build.
import { createClient } from '@supabase/supabase-js';

let cachedClient = null;

export function getSupabaseAdmin() {
  if (!cachedClient) {
    cachedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return cachedClient;
}
