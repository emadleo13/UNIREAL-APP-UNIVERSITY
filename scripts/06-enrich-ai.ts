/**
 * Batch AI enrichment of universities in Supabase.
 *
 * Proactively fills the editorial fields (description, programs, tuition,
 * admission window + deadline, international info) that otherwise only get
 * filled lazily when someone opens a university page. Uses the SAME prompt and
 * parsing as the live on-view refresh (lib/data/enrich-core.ts), so results are
 * identical — including the "deadlines must be in the future" guard.
 *
 * Usage (vars are read from .env.local automatically):
 *   npx tsx scripts/06-enrich-ai.ts                       # Romania (default)
 *   npx tsx scripts/06-enrich-ai.ts --countries=Romania,Bulgaria
 *   npx tsx scripts/06-enrich-ai.ts --countries=Romania --limit=10
 *   npx tsx scripts/06-enrich-ai.ts --countries=Romania --concurrency=4
 *   npx tsx scripts/06-enrich-ai.ts --countries=Romania --force   # re-do already-enriched
 *   npx tsx scripts/06-enrich-ai.ts --countries=Romania --dry-run # research, don't write
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY.
 * Safe to re-run: by default it skips universities that already have updated_at.
 */
import { readFileSync, existsSync } from 'node:fs';
import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { researchUniversity, todayISO } from '../lib/data/enrich-core';
import { researchUniversityGemini } from '../lib/data/enrich-gemini';
import type { University } from '../lib/data/types';
import { arg, sleep } from './_util';

// Load .env.local so you can just run the script with no inline vars.
for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;
if (!url || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

// --provider=claude (default) uses Anthropic + web_search;
// --provider=gemini uses the free Gemini tier with Google Search grounding.
const provider = (arg('provider', 'claude') as string).toLowerCase();
if (provider !== 'claude' && provider !== 'gemini') {
  console.error(`Unknown --provider=${provider} (use claude or gemini).`);
  process.exit(1);
}
if (provider === 'claude' && !anthropicKey) {
  console.error('Set ANTHROPIC_API_KEY (or use --provider=gemini).');
  process.exit(1);
}
if (provider === 'gemini' && !geminiKey) {
  console.error('Set GEMINI_API_KEY (or use --provider=claude).');
  process.exit(1);
}

const countries = (arg('countries', 'Romania') as string)
  .split(',')
  .map((c) => c.trim())
  .filter(Boolean);
const limit = Number(arg('limit', '0')) || 0; // 0 = no limit
const concurrency = Math.max(1, Number(arg('concurrency', '3')) || 3);
const force = process.argv.includes('--force');
const dryRun = process.argv.includes('--dry-run');

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket as never },
});
const anthropic = provider === 'claude' ? new Anthropic({ apiKey: anthropicKey }) : null;

// Free Gemini tier has a low requests-per-minute cap — pace accordingly.
const paceMs = provider === 'gemini' ? 7000 : 500;

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Minimal DB row → University (only the fields the researcher prompt needs). */
function toUniversity(r: any): University {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    country: r.country,
    countryCode: r.country_code,
    city: r.city ?? undefined,
    website: r.website ?? undefined,
    domains: r.domains ?? [],
    source: r.source ?? [],
  };
}

/** Partial<University> editorial fields → snake_case universities row. */
function toRow(data: Partial<University>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (data.description_i18n) row.description_i18n = data.description_i18n;
  if (data.programsCount != null) row.programs_count = data.programsCount;
  if (data.programs) row.programs = data.programs;
  if (data.size != null) row.size = data.size;
  if (data.tuition != null) row.tuition = data.tuition;
  if (data.tuitionCurrency) row.tuition_currency = data.tuitionCurrency;
  if (data.admission) row.admission = data.admission;
  if (data.updatedAt) row.updated_at = data.updatedAt;
  return row;
}

async function main() {
  const today = todayISO();
  console.log(
    `Enriching countries=[${countries.join(', ')}] provider=${provider} concurrency=${concurrency}` +
      `${limit ? ` limit=${limit}` : ''}${force ? ' force' : ''}${dryRun ? ' DRY-RUN' : ''}`
  );

  let query = supabase
    .from('universities')
    .select('id, slug, name, country, country_code, city, website, domains, source')
    .in('country', countries)
    .order('research_score', { ascending: false, nullsFirst: false });
  if (!force) query = query.is('updated_at', null);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }
  const targets = (data ?? []).map(toUniversity);
  console.log(`Found ${targets.length} universities to enrich.\n`);
  if (targets.length === 0) return;

  let done = 0;
  let filled = 0;
  let failed = 0;
  let cursor = 0;

  async function worker(workerId: number) {
    while (cursor < targets.length) {
      const uni = targets[cursor++];
      const n = ++done;
      try {
        const fresh =
          provider === 'gemini'
            ? await researchUniversityGemini(geminiKey!, uni, today)
            : await researchUniversity(anthropic!, uni, today);
        if (!fresh) {
          failed++;
          console.log(`[${n}/${targets.length}] ✗ ${uni.name} — no data`);
          continue;
        }
        const row = toRow(fresh);
        const fields = Object.keys(row).filter((k) => k !== 'updated_at');
        if (!dryRun) {
          const { error: upErr } = await supabase
            .from('universities')
            .update(row)
            .eq('slug', uni.slug);
          if (upErr) {
            failed++;
            console.log(`[${n}/${targets.length}] ✗ ${uni.name} — write: ${upErr.message}`);
            continue;
          }
        }
        filled++;
        const deadline = fresh.admission?.deadline ?? fresh.international?.deadline ?? '—';
        console.log(
          `[${n}/${targets.length}] ✓ ${uni.name} — ${fields.length} fields, deadline ${deadline}`
        );
      } catch (e) {
        failed++;
        console.log(`[${n}/${targets.length}] ✗ ${uni.name} — ${String(e)}`);
      }
      // Gentle pacing to stay under rate limits.
      await sleep(paceMs);
    }
    void workerId;
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, targets.length) }, (_, i) => worker(i))
  );

  console.log(
    `\nDone. enriched=${filled} failed=${failed} total=${targets.length}` +
      `${dryRun ? ' (dry-run, nothing written)' : ''}`
  );
}

main();
