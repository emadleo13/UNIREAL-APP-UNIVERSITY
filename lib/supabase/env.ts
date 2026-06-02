/** Supabase env access + a guard so the app keeps working in mock mode. */

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

/** True only when both public Supabase vars are present. */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(url && anonKey);
}

export function requireSupabaseEnv() {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    throw new Error(
      'Supabase env not set. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return { url, anonKey };
}

/**
 * Admin allow-list — these emails see the /admin panel. Comma-separated.
 * NEXT_PUBLIC_ADMIN_EMAILS is readable in the browser (for the header link);
 * ADMIN_EMAILS is the server-side source of truth for the /admin gate.
 */
export function getAdminEmails(): string[] {
  const raw =
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    process.env.ADMIN_EMAILS ||
    'emadcomircom@gmail.com';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
