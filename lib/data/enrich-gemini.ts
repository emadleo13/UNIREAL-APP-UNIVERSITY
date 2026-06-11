/**
 * Gemini-backed research provider for the batch enrichment script.
 * ------------------------------------------------------------------------
 * Free-tier alternative to the Anthropic path in enrich-core.ts: uses the
 * Gemini API with Google Search grounding (free daily quota) so we can keep
 * enriching universities at zero API cost. Reuses the SAME prompt, JSON
 * extraction and future-deadline guard as enrich-core, so output quality
 * rules are identical — a bad/empty response returns null and nothing is
 * written to the DB.
 *
 * Runtime-agnostic on purpose (plain fetch, key passed in) like enrich-core.
 */
import type { University } from './types';
import {
  buildEnrichSystem,
  buildEnrichPrompt,
  extractJson,
  toPartialUniversity,
  todayISO,
  type FreshJson,
} from './enrich-core';

/**
 * Free-tier models with Google Search grounding, in preference order. The
 * 2.5 model is better but its free pool is often congested (503) — fall back
 * to 2.0-flash instead of failing the university.
 */
export const GEMINI_ENRICH_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Free-tier RPM is low — retry 429/503 with growing waits before giving up. */
const RETRY_DELAYS_MS = [15_000, 45_000];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* eslint-disable @typescript-eslint/no-explicit-any */

async function callModel(
  apiKey: string,
  model: string,
  body: unknown
): Promise<{ text: string | null; transient: boolean }> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    // 429 = rate limit, 503 = free-pool congestion — both worth retrying.
    if ((res.status === 429 || res.status === 503) && attempt < RETRY_DELAYS_MS.length) {
      console.log(
        `  · ${model} ${res.status} — waiting ${RETRY_DELAYS_MS[attempt] / 1000}s…`
      );
      await sleep(RETRY_DELAYS_MS[attempt]);
      continue;
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`Gemini ${model} error ${res.status}: ${errText.slice(0, 200)}`);
      return { text: null, transient: res.status === 429 || res.status === 503 };
    }

    const data: any = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) return { text: null, transient: false };
    const text = parts
      .map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
      .join('\n')
      .trim();
    return { text: text || null, transient: false };
  }
}

async function callGemini(
  apiKey: string,
  system: string,
  prompt: string
): Promise<string | null> {
  const baseBody = {
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
  };

  for (const model of GEMINI_ENRICH_MODELS) {
    const body = {
      ...baseBody,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
        // 2.5 models think by default and the thoughts eat the output budget,
        // leaving an empty answer — disable thinking for this extraction task.
        ...(model.startsWith('gemini-2.5')
          ? { thinkingConfig: { thinkingBudget: 0 } }
          : {}),
      },
    };
    const { text } = await callModel(apiKey, model, body);
    if (text) return text;
    // Empty/failed answer → try the next model in the list.
  }
  return null;
}

/**
 * Gemini is looser with the schema than Claude (ranges as strings, timestamps
 * instead of dates, essay-length periods) — these extra rules plus the
 * sanitizer below keep its output to the same standard.
 */
const GEMINI_FORMAT_RULES = `

STRICT FORMAT RULES:
- "tuitionEur", "size" and "programsCount" must be plain JSON numbers — never ranges, never strings.
- "admissionDeadline" must be exactly YYYY-MM-DD (no time part) and must be the NEAREST upcoming deadline.
- "admissionPeriod" must be short, e.g. "July – September" — one intake window only, max 8 words.`;

function toNum(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    // Accept "3500", "3,500" or a range like "3000-4000" (use the midpoint).
    const nums = v.replace(/[,\s]/g, '').match(/\d+(\.\d+)?/g)?.map(Number) ?? [];
    if (nums.length === 1) return nums[0];
    if (nums.length >= 2) return Math.round((nums[0] + nums[1]) / 2);
  }
  return undefined;
}

function sanitize(j: Record<string, unknown>): FreshJson {
  const out: FreshJson = {};
  const tuition = toNum(j.tuitionEur);
  if (tuition) out.tuitionEur = tuition;
  const size = toNum(j.size);
  if (size) out.size = size;
  const programsCount = toNum(j.programsCount);
  if (programsCount) out.programsCount = programsCount;
  if (Array.isArray(j.programs)) {
    out.programs = j.programs
      .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
      .slice(0, 10);
  }
  if (typeof j.admissionPeriod === 'string' && j.admissionPeriod.trim()) {
    out.admissionPeriod = j.admissionPeriod.trim().slice(0, 80);
  }
  if (typeof j.admissionDeadline === 'string') {
    const m = j.admissionDeadline.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) out.admissionDeadline = m[1];
  }
  return out;
}

/**
 * Full enrichment for one university via Gemini + Google Search grounding.
 * Same contract as enrich-core's researchUniversity: null on any failure so
 * the record stays untouched and retryable.
 */
export async function researchUniversityGemini(
  apiKey: string,
  uni: University,
  today: string = todayISO()
): Promise<Partial<University> | null> {
  try {
    const text = await callGemini(
      apiKey,
      buildEnrichSystem(today) + GEMINI_FORMAT_RULES,
      buildEnrichPrompt(uni, today)
    );
    if (!text) return null;
    const json = extractJson<Record<string, unknown>>(text);
    if (!json) return null;

    const partial = toPartialUniversity(sanitize(json), today);
    partial.updatedAt = new Date().toISOString();
    partial.aiEnriched = true;
    return partial;
  } catch (e) {
    console.error('researchUniversityGemini failed:', e);
    return null;
  }
}
