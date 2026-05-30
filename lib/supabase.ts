/**
 * Lazy Supabase client placeholder.
 *
 * The Supabase JS client is intentionally NOT a dependency yet (the app runs in
 * mock mode). When you're ready to switch on Supabase:
 *
 *   1. npm install @supabase/supabase-js
 *   2. Replace the body of `getSupabaseClient` below with:
 *        import { createClient } from '@supabase/supabase-js';
 *        return createClient(url, anonKey);
 *   3. Set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *   4. Implement lib/data/supabase/index.ts using this client.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Supabase env not set. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return { url, anonKey };
}

export function getSupabaseClient(): never {
  getSupabaseEnv();
  throw new Error(
    'Supabase client not wired yet. Install @supabase/supabase-js and implement getSupabaseClient().'
  );
}
