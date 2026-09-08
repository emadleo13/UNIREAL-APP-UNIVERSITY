import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { researchUniversity, todayISO } from '@/lib/data/enrich-core';
import { researchUniversityGemini } from '@/lib/data/enrich-gemini';
import { getAnthropic, isAIConfigured } from '@/lib/ai/anthropic';
import type { University } from '@/lib/data/types';
import { EXCLUDED_COUNTRIES } from '@/lib/data/regions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Research is slow (one web-grounded call per university) — take the ceiling.
export const maxDuration = 300;

/**
 * Daily background enrichment.
 *
 * Fills in universities that have no editorial data yet (`updated_at is null`),
 * highest research_score first, so the most-searched profiles are never empty —
 * the same selection scripts/06 uses, but running in production on a schedule
 * instead of on someone's laptop.
 *
 * Gemini is the default provider: its free tier costs nothing, and enrichment
 * is a bulk background job where latency does not matter. Claude is the
 * fallback when GEMINI_API_KEY is absent.
 *
 * This deliberately does NOT consume the on-view AI budget (claimAiBudget):
 * that budget exists to cap what anonymous visitors can trigger, while this is
 * our own scheduled work with a fixed, known batch size.
 *
 * Protected by CRON_SECRET, like the other cron routes.
 */

/**
 * Upper bound on how many universities one run fetches. The real limiter is
 * TIME_BUDGET_MS below: a grounded research call takes roughly 15-25s, so a
 * 240s window fits about 10-15. Fetching a few more than that costs one cheap
 * query and lets a fast run use the whole window instead of finishing early.
 */
const DEFAULT_BATCH = 15;
/** Stop starting new work this close to the function timeout (ms). */
const TIME_BUDGET_MS = 240_000;
/**
 * Give up after this many failures in a row. A spent Gemini free-tier quota
 * fails every call with 429 and each attempt burns ~60s in provider retries,
 * so without this the run would spend its whole window achieving nothing.
 */
const MAX_CONSECUTIVE_FAILURES = 3;

/* eslint-disable @typescript-eslint/no-explicit-any */

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

/** Editorial fields → snake_case row. Mirrors scripts/06 and scripts/08. */
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

export async function GET(req: Request) {
  const startedAt = Date.now();

  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const provided =
    req.headers.get('authorization')?.replace('Bearer ', '') ??
    url.searchParams.get('secret');
  if (!secret) {
    // Vercel only sends `Authorization: Bearer <CRON_SECRET>` when that env var
    // exists, so a missing one makes every scheduled run 401 — silently, and
    // for every cron at once. Say so in the logs; the response stays generic.
    console.error(
      'cron: CRON_SECRET is not set in this environment — every scheduled run will 401.'
    );
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (provided !== secret) {
    console.warn('cron: rejected a request with a missing or wrong secret.');
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const useGemini = Boolean(geminiKey);
  if (!useGemini && !isAIConfigured()) {
    return NextResponse.json(
      { error: 'no AI provider configured (set GEMINI_API_KEY or ANTHROPIC_API_KEY)' },
      { status: 500 }
    );
  }

  const batch = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get('limit')) || DEFAULT_BATCH)
  );

  // Two queues. Default: profiles that have never been enriched. Backfill:
  // profiles that were enriched before the researcher prompt asked for a
  // description, so they carry facts but no prose — which is exactly what the
  // page body and the per-page meta description are built from. Backfill is
  // opt-in because the default queue is ~10k long and would never reach it.
  const mode = url.searchParams.get('mode') === 'backfill' ? 'backfill' : 'new';

  const admin = createSupabaseAdminClient();
  let query = admin
    .from('universities')
    .select('id, slug, name, country, country_code, city, website, domains, source');
  query =
    mode === 'backfill'
      ? query.not('updated_at', 'is', null).is('description_i18n', null)
      : query.is('updated_at', null);

  // Countries dropped from the product are hidden from the listings and the
  // sitemap, so researching them buys nothing — skip them rather than pay for
  // pages no visitor can reach.
  if (EXCLUDED_COUNTRIES.length) {
    query = query.not(
      'country',
      'in',
      `(${EXCLUDED_COUNTRIES.map((c) => `"${c}"`).join(',')})`
    );
  }

  const { data: rows, error } = await query
    .order('research_score', { ascending: false, nullsFirst: false })
    .limit(batch);

  if (error) {
    console.error('enrich cron: query failed:', error.message);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }
  if (!rows?.length) {
    return NextResponse.json({ ok: true, mode, remaining: 0, filled: 0, note: 'nothing left to enrich' });
  }

  const today = todayISO();
  const anthropic = useGemini ? null : getAnthropic();
  let filled = 0;
  let failed = 0;
  let skipped = 0;
  let consecutiveFailures = 0;
  let abortedReason: string | null = null;

  for (const row of rows) {
    // Leave room to return a real response instead of being killed mid-write.
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      abortedReason = 'time budget reached';
      skipped = rows.length - filled - failed;
      break;
    }
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      abortedReason = `${MAX_CONSECUTIVE_FAILURES} consecutive failures (provider quota?)`;
      skipped = rows.length - filled - failed;
      break;
    }
    const uni = toUniversity(row);
    try {
      const fresh = useGemini
        ? await researchUniversityGemini(geminiKey!, uni, today)
        : await researchUniversity(anthropic!, uni, today);
      if (!fresh) {
        failed++;
        consecutiveFailures++;
        continue;
      }
      const update = toRow(fresh);
      if (Object.keys(update).length === 0) {
        failed++;
        consecutiveFailures++;
        continue;
      }
      const { error: writeErr } = await admin
        .from('universities')
        .update(update)
        .eq('slug', uni.slug);
      if (writeErr) {
        console.error(`enrich cron: write failed for ${uni.slug}:`, writeErr.message);
        failed++;
        consecutiveFailures++;
        continue;
      }
      filled++;
      consecutiveFailures = 0;
    } catch (e) {
      console.error(`enrich cron: ${uni.slug} threw:`, e);
      failed++;
      consecutiveFailures++;
    }
  }

  const { count: remaining } = await admin
    .from('universities')
    .select('*', { count: 'exact', head: true })
    .is('updated_at', null);

  console.log(
    `enrich cron: filled ${filled}, failed ${failed}, skipped ${skipped}, ${remaining} left.` +
      (abortedReason ? ` Aborted: ${abortedReason}.` : '')
  );

  return NextResponse.json({
    ok: true,
    mode,
    provider: useGemini ? 'gemini' : 'claude',
    filled,
    failed,
    skipped,
    remaining: remaining ?? null,
    aborted: abortedReason,
    tookMs: Date.now() - startedAt,
  });
}
