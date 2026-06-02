'use client';

import { createBrowserClient } from '@supabase/ssr';
import { requireSupabaseEnv } from './env';

/** Browser Supabase client (uses the anon key + cookie-based session). */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = requireSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
