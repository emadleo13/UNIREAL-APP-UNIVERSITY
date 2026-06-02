import { cookies } from 'next/headers';
import WebSocket from 'ws';
import { createServerClient } from '@supabase/ssr';
import { requireSupabaseEnv } from './env';

/**
 * Server Supabase client bound to the request cookies. Use in Server
 * Components, server actions and route handlers. Reads the signed-in session.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    realtime: { transport: WebSocket as never },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component (read-only cookies) — safe to ignore;
          // session refresh is handled client-side / in route handlers.
        }
      },
    },
  });
}

/** Returns the currently signed-in user (or null), or null if not configured. */
export async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
