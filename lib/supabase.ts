/**
 * Back-compat re-exports. The real clients now live in lib/supabase/:
 *   - browser:  lib/supabase/client.ts  → createSupabaseBrowserClient()
 *   - server:   lib/supabase/server.ts  → createSupabaseServerClient()
 *   - service:  lib/supabase/admin.ts   → createSupabaseAdminClient()
 */
export {
  getSupabaseEnv,
  isSupabaseConfigured,
  requireSupabaseEnv,
} from './supabase/env';
