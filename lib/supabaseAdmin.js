// SERVER-ONLY. Never import this into a 'use client' file or expose
// SUPABASE_SERVICE_ROLE_KEY to the browser — it bypasses all Row Level
// Security. It's only safe here because API routes run on the server.
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
