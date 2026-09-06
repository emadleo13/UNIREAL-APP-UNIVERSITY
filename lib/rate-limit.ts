import 'server-only';
import { headers } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/env';

/**
 * Rate limiting + AI spend cap, backed by Postgres (see migration 0010).
 *
 * Server actions and route handlers are public HTTP endpoints — the browser
 * form is only one possible caller. Without a limit a script can replay the
 * lead form, the chat lookup or the AI refresh thousands of times: e-mail
 * bombing, database load, and (for anything that reaches Claude) a real bill.
 *
 * Why Postgres and not Redis: the counters need to be shared across Vercel's
 * serverless instances, and Supabase is already that shared store. Postgres
 * `INSERT … ON CONFLICT DO UPDATE … RETURNING` is a single atomic statement,
 * so it gives the same race-free guarantee as Redis INCR. The trade-off is
 * that a request flood also writes here — acceptable at this traffic, and the
 * counting all happens inside one round-trip per check.
 *
 * NOT CONFIGURED = OPEN. Without Supabase env vars every call is allowed and a
 * warning is logged once, so local dev and mock mode keep working.
 */

let warned = false;

function warnOnce() {
  if (warned) return;
  warned = true;
  console.warn(
    '[rate-limit] Supabase not configured — rate limiting and the AI budget cap are DISABLED.'
  );
}

export function isRateLimitConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Limits, one fixed window per action. Tuned to be invisible to real users. */
const LIMITS = {
  /** "Request info" form — the one that sends e-mail. */
  lead: { limit: 3, windowSecs: 3600 },
  /** EMi chat lookup — hits a pg_trgm fuzzy search. */
  chat: { limit: 20, windowSecs: 60 },
  /** Reviews / questions / answers. */
  community: { limit: 10, windowSecs: 3600 },
  /** Quiz matching — reads up to 1000 rows per call. */
  quiz: { limit: 30, windowSecs: 60 },
  /** The on-view AI freshness refresh. */
  refresh: { limit: 10, windowSecs: 3600 },
  /** Stripe checkout / portal session creation. */
  billing: { limit: 10, windowSecs: 3600 },
} as const;

export type LimitName = keyof typeof LIMITS;

/**
 * Caller identity for the limit bucket: the signed-in user id when we have one
 * (stable across networks), otherwise the client IP from the proxy headers.
 */
export async function callerId(userId?: string | null): Promise<string> {
  if (userId) return `u:${userId}`;
  try {
    const h = await headers();
    const forwarded = h.get('x-forwarded-for');
    const ip =
      forwarded?.split(',')[0]?.trim() || h.get('x-real-ip')?.trim() || 'unknown';
    return `ip:${ip}`;
  } catch {
    return 'ip:unknown';
  }
}

/**
 * Returns true when the call is allowed. Fails OPEN: if the database is
 * unreachable we let the request through rather than taking the site down
 * over a limiter.
 */
export async function checkRateLimit(
  name: LimitName,
  userId?: string | null
): Promise<boolean> {
  if (!isRateLimitConfigured()) {
    warnOnce();
    return true;
  }
  const { limit, windowSecs } = LIMITS[name];
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.rpc('consume_rate_limit', {
      p_bucket: name,
      p_caller: await callerId(userId),
      p_limit: limit,
      p_window_secs: windowSecs,
    });
    if (error) {
      console.error(`[rate-limit] ${name} check failed (allowing):`, error.message);
      return true;
    }
    return data !== false;
  } catch (e) {
    console.error(`[rate-limit] ${name} check threw (allowing):`, e);
    return true;
  }
}

/* ── AI budget ────────────────────────────────────────────────────────────── */

/**
 * Hard ceiling on how many Claude calls the *whole site* may make in one day.
 * A crawler walking all ~10k university URLs would otherwise trigger one
 * web-search research call each. Override with AI_DAILY_CALL_BUDGET.
 */
const DEFAULT_DAILY_AI_BUDGET = 300;

function dailyBudget(): number {
  const raw = Number(process.env.AI_DAILY_CALL_BUDGET);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_DAILY_AI_BUDGET;
}

/**
 * Atomically claim one unit of today's AI budget.
 *
 * The counter is incremented and read in one statement, so N concurrent
 * requests get N distinct numbers — there is no read-then-write window where
 * several requests all see "budget left" and each fires its own paid call.
 *
 * Returns false when the budget is spent; callers must then fall back to the
 * cached record instead of calling Claude.
 */
export async function claimAiBudget(): Promise<boolean> {
  if (!isRateLimitConfigured()) {
    warnOnce();
    return true;
  }
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.rpc('claim_ai_budget', {
      p_budget: dailyBudget(),
    });
    if (error) {
      console.error('[ai-budget] claim failed (allowing):', error.message);
      return true;
    }
    if (data === false) {
      console.warn(`[ai-budget] daily budget of ${dailyBudget()} reached.`);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[ai-budget] claim threw (allowing):', e);
    return true;
  }
}

/**
 * Take a short-lived lock so two visitors landing on the same un-enriched
 * university page don't both pay for the same research call. Exactly one
 * caller wins the row; the lock expires on its own so a crash can't wedge a
 * university permanently. Returns false when someone else holds it.
 */
export async function acquireEnrichLock(
  slug: string,
  ttlSeconds = 120
): Promise<boolean> {
  if (!isRateLimitConfigured()) return true;
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.rpc('acquire_ai_lock', {
      p_slug: slug,
      p_ttl_secs: ttlSeconds,
    });
    if (error) {
      console.error('[ai-budget] lock failed (allowing):', error.message);
      return true;
    }
    return data !== false;
  } catch (e) {
    console.error('[ai-budget] lock threw (allowing):', e);
    return true;
  }
}
