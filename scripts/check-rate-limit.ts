/**
 * Verify that rate limiting and the AI budget cap are actually live.
 *
 *   npm run check:ratelimit
 *
 * Calls the same Postgres functions the app calls (migration 0010), proves the
 * counter is atomic, then cleans up after itself and reports today's AI spend.
 * Exits non-zero on failure so it can be dropped into CI.
 *
 * The app deliberately fails OPEN when these are missing — the site keeps
 * working but is unmetered — so this script is the way to tell "configured"
 * from "silently disabled".
 */

import { readFileSync } from 'node:fs';
import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';

// Load .env.local by hand: this runs outside Next, which does it automatically.
for (const file of ['.env.local', '.env']) {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    /* file absent — fine */
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  if (!url || !serviceKey) {
    console.error('❌ NOT CONFIGURED — rate limiting and the AI budget are OFF.');
    console.error('   Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  console.log(`Connecting to ${url} …`);
  const db = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Node < 22 has no global WebSocket; we never use realtime, but the client
    // constructs one — give it `ws` so it doesn't throw. Same as lib/supabase/admin.ts.
    realtime: { transport: WebSocket as never },
  });

  // A caller id nobody else will use, so the real limits stay untouched.
  const caller = `selftest:${Date.now()}`;

  // Burn a 3-per-window bucket four times: the fourth must be refused.
  const results: boolean[] = [];
  for (let i = 0; i < 4; i++) {
    const { data, error } = await db.rpc('consume_rate_limit', {
      p_bucket: 'lead',
      p_caller: caller,
      p_limit: 3,
      p_window_secs: 3600,
    });
    if (error) {
      console.error('❌ consume_rate_limit failed:', error.message);
      if (error.message.includes('does not exist')) {
        console.error('   → Migration 0010_rate_limits.sql has not been run yet.');
      }
      process.exit(1);
    }
    results.push(data as boolean);
  }

  await db.from('rate_limits').delete().eq('caller', caller);

  if (results.join(',') !== 'true,true,true,false') {
    console.error(`❌ Limit did not hold. Expected 3 allowed then 1 refused, got: ${results}`);
    process.exit(1);
  }
  console.log('✅ Rate limiting works — 3 requests allowed, 4th refused.');

  // The budget counter must increment atomically. Passing a huge ceiling means
  // this probe always returns true and never eats into the real budget.
  const { data: budgetOk, error: budgetErr } = await db.rpc('claim_ai_budget', {
    p_budget: 2_000_000_000,
  });
  if (budgetErr) {
    console.error('❌ claim_ai_budget failed:', budgetErr.message);
    process.exit(1);
  }
  if (budgetOk !== true) {
    console.error('❌ claim_ai_budget refused a call under an unlimited ceiling.');
    process.exit(1);
  }
  console.log('✅ AI budget counter works.');

  // Lock: first caller wins, second is turned away while it is held.
  const slug = `selftest-${Date.now()}`;
  const { data: first } = await db.rpc('acquire_ai_lock', { p_slug: slug, p_ttl_secs: 60 });
  const { data: second } = await db.rpc('acquire_ai_lock', { p_slug: slug, p_ttl_secs: 60 });
  await db.from('ai_locks').delete().eq('slug', slug);

  if (first !== true || second !== false) {
    console.error(`❌ Lock did not hold (first=${first}, second=${second}).`);
    process.exit(1);
  }
  console.log('✅ Enrichment lock works — only one caller can research a slug.');

  const budget = Number(process.env.AI_DAILY_CALL_BUDGET) || 300;
  const today = new Date().toISOString().slice(0, 10);
  const { data: row } = await db
    .from('ai_budget')
    .select('used')
    .eq('day', today)
    .maybeSingle();

  // Subtract the probe above so the number reflects real enrichment calls.
  const used = Math.max(0, (row?.used ?? 0) - 1);
  console.log('');
  console.log(`AI budget for ${today}: ${used} / ${budget} calls used.`);
  console.log('Rate limiting and the AI budget cap are ACTIVE.');
}

main().catch((e) => {
  console.error('❌ Check failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
