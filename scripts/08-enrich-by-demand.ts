/**
 * Demand-first AI enrichment.
 *
 * Instead of walking the DB country-by-country (scripts/06), this targets the
 * exact university pages that already receive Google impressions — the highest-
 * ROI pages to fill, because the search demand is already proven. It reads a
 * Google Search Console "Pages" CSV export, extracts the /universities/<slug>
 * URLs, sums impressions across the en/fa/ro locale variants of each page, and
 * enriches the still-empty ones highest-impression-first.
 *
 * Refresh the input any time from GSC → Performance → Pages → Export, saved to
 * data/gsc-pages.csv (or pass --csv=<path>). Uses the SAME prompt, parsing and
 * write path as scripts/06 (lib/data/enrich-core.ts), so results are identical.
 *
 * Usage (vars read from .env.local automatically):
 *   npx tsx scripts/08-enrich-by-demand.ts --plan          # preview the queue, no AI calls
 *   npx tsx scripts/08-enrich-by-demand.ts --provider=gemini
 *   npx tsx scripts/08-enrich-by-demand.ts --provider=gemini --dry-run
 *   npx tsx scripts/08-enrich-by-demand.ts --csv=data/gsc-pages.csv --min-impr=2
 *   npx tsx scripts/08-enrich-by-demand.ts --provider=claude --limit=20
 *   npx tsx scripts/08-enrich-by-demand.ts --force   # re-do already-enriched too
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and either
 * GEMINI_API_KEY (--provider=gemini) or ANTHROPIC_API_KEY (--provider=claude).
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

const provider = (arg('provider', 'gemini') as string).toLowerCase();
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

const csvPath = arg('csv', 'data/gsc-pages.csv') as string;
const minImpr = Number(arg('min-impr', '1')) || 1;
const limit = Number(arg('limit', '0')) || 0; // 0 = no limit
const concurrency = Math.max(1, Number(arg('concurrency', '1')) || 1);
const force = process.argv.includes('--force');
const dryRun = process.argv.includes('--dry-run');
// --plan: parse CSV + look up the DB + print the priority queue, then stop —
// no AI calls at all (unlike --dry-run, which still researches, just doesn't write).
const planOnly = process.argv.includes('--plan');

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket as never },
});
const anthropic = provider === 'claude' ? new Anthropic({ apiKey: anthropicKey }) : null;

// Free Gemini tier has a low requests-per-minute cap — pace accordingly.
const paceMs = provider === 'gemini' ? 7000 : 500;

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Minimal DB row → University (only the fields the researcher prompt needs). Mirrors scripts/06. */
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

/** Partial<University> editorial fields → snake_case universities row. Mirrors scripts/06. */
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

/**
 * Parse a GSC Pages CSV → { slug → total impressions }, summed across locales.
 * The URL column never contains a comma, so a plain split is safe. Only
 * /universities/<slug> rows count (field/study-in/blog pages aren't DB rows).
 */
function parseDemand(csv: string): Map<string, number> {
  const bySlug = new Map<string, number>();
  const lines = csv.split('\n');
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    const pageUrl = parts[0];
    const impr = parseInt(parts[2], 10);
    if (!pageUrl || !Number.isFinite(impr)) continue;
    const marker = '/universities/';
    const idx = pageUrl.indexOf(marker);
    if (idx === -1) continue;
    const slug = pageUrl.slice(idx + marker.length).split(/[/?#]/)[0];
    if (!slug) continue; // the bare /universities listing page
    bySlug.set(slug, (bySlug.get(slug) ?? 0) + impr);
  }
  return bySlug;
}

async function main() {
  const today = todayISO();
  if (!existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath} (export GSC → Performance → Pages).`);
    process.exit(1);
  }
  const demand = parseDemand(readFileSync(csvPath, 'utf8'));
  const ranked = [...demand.entries()]
    .filter(([, impr]) => impr >= minImpr)
    .sort((a, b) => b[1] - a[1]);

  console.log(
    `Demand enrichment from ${csvPath} provider=${provider} concurrency=${concurrency}` +
      ` min-impr=${minImpr}${limit ? ` limit=${limit}` : ''}${force ? ' force' : ''}` +
      `${dryRun ? ' DRY-RUN' : ''}`
  );
  console.log(`${demand.size} university pages in export, ${ranked.length} with >=${minImpr} impressions.\n`);
  if (ranked.length === 0) return;

  const slugs = ranked.map(([s]) => s);
  const imprBySlug = new Map(ranked);

  // Fetch the matching rows (chunk the IN filter to be safe).
  const rows: any[] = [];
  for (let i = 0; i < slugs.length; i += 100) {
    const chunk = slugs.slice(i, i + 100);
    const { data, error } = await supabase
      .from('universities')
      .select('id, slug, name, country, country_code, city, website, domains, source, updated_at')
      .in('slug', chunk);
    if (error) {
      console.error('Query failed:', error.message);
      process.exit(1);
    }
    rows.push(...(data ?? []));
  }
  const bySlug = new Map(rows.map((r) => [r.slug, r]));

  // Report slugs from the export that aren't in the DB (typos / removed rows).
  const missing = slugs.filter((s) => !bySlug.has(s));
  if (missing.length) {
    console.log(`⚠ ${missing.length} slug(s) in export not found in DB: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? '…' : ''}\n`);
  }

  // Targets: keep DB order by demand; skip already-enriched unless --force.
  let targets = slugs
    .map((s) => bySlug.get(s))
    .filter(Boolean)
    .filter((r) => force || !r.updated_at);
  const alreadyEnriched = slugs.filter((s) => bySlug.get(s)?.updated_at).length;
  if (limit) targets = targets.slice(0, limit);

  console.log(
    `${targets.length} to enrich (${alreadyEnriched} of the demand pages already enriched, skipped).\n`
  );
  if (targets.length === 0) return;

  // Preview the queue so the priority is visible even in a dry run.
  console.log('Priority queue (impressions · country · name):');
  for (const r of targets.slice(0, 20)) {
    console.log(`  ${String(imprBySlug.get(r.slug) ?? 0).padStart(3)}  ${String(r.country).padEnd(16)} ${r.name}`);
  }
  if (targets.length > 20) console.log(`  … +${targets.length - 20} more`);
  console.log('');

  if (planOnly) {
    console.log('(--plan: no AI calls made. Drop --plan to enrich.)');
    return;
  }

  const unis = targets.map(toUniversity);
  let done = 0;
  let filled = 0;
  let failed = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < unis.length) {
      const i = cursor++;
      const uni = unis[i];
      const impr = imprBySlug.get(uni.slug) ?? 0;
      const n = ++done;
      try {
        const fresh =
          provider === 'gemini'
            ? await researchUniversityGemini(geminiKey!, uni, today)
            : await researchUniversity(anthropic!, uni, today);
        if (!fresh) {
          failed++;
          console.log(`[${n}/${unis.length}] ✗ (${impr} impr) ${uni.name} — no data`);
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
            console.log(`[${n}/${unis.length}] ✗ (${impr} impr) ${uni.name} — write: ${upErr.message}`);
            continue;
          }
        }
        filled++;
        const deadline = fresh.admission?.deadline ?? fresh.international?.deadline ?? '—';
        console.log(
          `[${n}/${unis.length}] ✓ (${impr} impr) ${uni.name} — ${fields.length} fields, deadline ${deadline}`
        );
      } catch (e) {
        failed++;
        console.log(`[${n}/${unis.length}] ✗ (${impr} impr) ${uni.name} — ${String(e)}`);
      }
      await sleep(paceMs);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, unis.length) }, () => worker()));

  console.log(
    `\nDone. enriched=${filled} failed=${failed} total=${unis.length}` +
      `${dryRun ? ' (dry-run, nothing written)' : ''}`
  );
}

main();
