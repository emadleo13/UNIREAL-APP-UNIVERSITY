import 'server-only';
import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';
import { requireSupabaseEnv } from './env';

/**
 * Service-role Supabase client — bypasses RLS. SERVER ONLY. Never import this
 * into client code. Used by webhooks, cron jobs and admin reads.
 */
export function createSupabaseAdminClient() {
  const { url } = requireSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Node < 22 has no global WebSocket; we never use realtime, but the client
    // constructs one — give it `ws` so it doesn't throw.
    realtime: { transport: WebSocket as never },
  });
}
