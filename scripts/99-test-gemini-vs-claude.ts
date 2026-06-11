/**
 * One-off comparison: run the Gemini researcher (dry, no DB writes) on
 * universities Claude already enriched, and print both side by side.
 *
 *   npx tsx scripts/99-test-gemini-vs-claude.ts --countries=Bulgaria --limit=3
 */
import { readFileSync, existsSync } from 'node:fs';
import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';
import { researchUniversityGemini } from '../lib/data/enrich-gemini';
import { todayISO } from '../lib/data/enrich-core';
import type { University } from '../lib/data/types';
import { arg, sleep } from './_util';

for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const geminiKey = process.env.GEMINI_API_KEY!;
if (!url || !serviceKey || !geminiKey) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY');
  process.exit(1);
}

const countries = (arg('countries', 'Bulgaria') as string).split(',');
const limit = Number(arg('limit', '3')) || 3;

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket as never },
});

/* eslint-disable @typescript-eslint/no-explicit-any */

async function main() {
  // Only rows Claude already enriched (updated_at set) → direct comparison.
  const { data, error } = await supabase
    .from('universities')
    .select('id, slug, name, country, country_code, city, website, tuition, tuition_currency, size, programs_count, programs, admission, updated_at')
    .in('country', countries)
    .not('updated_at', 'is', null)
    .order('research_score', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;

  const today = todayISO();
  for (const r of data ?? []) {
    const uni: University = {
      id: r.id,
      slug: r.slug,
      name: r.name,
      country: r.country,
      countryCode: r.country_code,
      city: r.city ?? undefined,
      website: r.website ?? undefined,
      domains: [],
      source: [],
    };
    console.log(`\n━━━ ${r.name} ━━━`);
    console.log('CLAUDE (in DB):', JSON.stringify({
      tuition: r.tuition,
      currency: r.tuition_currency,
      size: r.size,
      programsCount: r.programs_count,
      programs: (r.programs ?? []).slice(0, 5),
      admission: r.admission,
    }, null, 1));

    const g = await researchUniversityGemini(geminiKey, uni, today);
    console.log('GEMINI (dry):  ', g
      ? JSON.stringify({
          tuition: g.tuition,
          currency: g.tuitionCurrency,
          size: g.size,
          programsCount: g.programsCount,
          programs: (g.programs ?? []).slice(0, 5),
          admission: g.admission,
        }, null, 1)
      : 'NO DATA');
    await sleep(7000);
  }
}

main();
