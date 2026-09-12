/**
 * Where enrichment stands, and whether today's batch has already run.
 *
 *   npm run check:enrich
 *
 * Enrichment is paced at one batch per UTC day so the Gemini grounding calls
 * stay inside the free daily allowance. That pacing only works if we can see,
 * before starting, how much of today is already spent — the nightly cron adds
 * its own rows, and a run can be interrupted halfway. This prints that.
 */

import { readFileSync } from 'node:fs';
import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';
import { EXCLUDED_COUNTRIES } from '../lib/data/regions';

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

/** Roughly what one grounded research call has cost us, in USD. */
const USD_PER_UNIVERSITY = 0.0022;
/** Calls per UTC day proven to stay inside the free grounding allowance. */
const PROVEN_FREE_DAILY = 600;

function utcDay(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

async function main() {
  if (!url || !serviceKey) {
    console.error('❌ Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const db = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Node < 22 has no global WebSocket; same shim as lib/supabase/admin.ts.
    realtime: { transport: WebSocket as never },
  });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  async function count(build: (q: any) => any, label: string): Promise<number> {
    const { count, error } = await build(
      db.from('universities').select('*', { count: 'exact', head: true })
    );
    if (error) {
      console.error(`❌ ${label} query failed:`, error.message);
      process.exit(1);
    }
    return count ?? 0;
  }

  // The queue the batch script actually walks: countries we no longer show are
  // never researched, so counting them would overstate what is left to do.
  const inScope = (q: any) =>
    EXCLUDED_COUNTRIES.length
      ? q.not('country', 'in', `(${EXCLUDED_COUNTRIES.map((c) => `"${c}"`).join(',')})`)
      : q;

  const today = utcDay();
  const yesterday = utcDay(-1);

  const total = await count(inScope, 'total');
  const enriched = await count((q: any) => inScope(q).not('updated_at', 'is', null), 'enriched');
  const described = await count(
    (q: any) => inScope(q).not('description_i18n', 'is', null),
    'described'
  );
  const filledToday = await count(
    (q: any) => inScope(q).gte('updated_at', `${today}T00:00:00Z`),
    'today'
  );
  const filledYesterday = await count(
    (q: any) =>
      inScope(q)
        .gte('updated_at', `${yesterday}T00:00:00Z`)
        .lt('updated_at', `${today}T00:00:00Z`),
    'yesterday'
  );

  const halfway = Math.ceil(total / 2);
  const toHalfway = Math.max(0, halfway - enriched);
  const pct = (n: number) => ((n / total) * 100).toFixed(1) + '%';

  console.log(`UTC day        ${today}  (now ${new Date().toISOString().slice(11, 16)}Z)`);
  console.log('');
  console.log(`In scope       ${total}`);
  console.log(`Enriched       ${enriched}  (${pct(enriched)})`);
  console.log(`With prose     ${described}  (${pct(described)})`);
  console.log(`Remaining      ${total - enriched}`);
  console.log('');
  console.log(`Filled today       ${filledToday}`);
  console.log(`Filled yesterday   ${filledYesterday}`);
  console.log('');
  console.log(
    `50% target     ${halfway} → ${toHalfway} to go` +
      (toHalfway ? `, about $${(toHalfway * USD_PER_UNIVERSITY).toFixed(2)}` : ' — reached 🎉')
  );

  const roomLeft = PROVEN_FREE_DAILY - filledToday;
  console.log('');
  if (roomLeft <= 0) {
    console.log(
      `⛔ Today's ${PROVEN_FREE_DAILY} are spent. Next batch after ${utcDay(1)}T00:00Z.`
    );
  } else {
    console.log(`✅ Room for ${roomLeft} more today (proven-free daily volume).`);
  }
}

main().catch((e) => {
  console.error('❌ Check failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
