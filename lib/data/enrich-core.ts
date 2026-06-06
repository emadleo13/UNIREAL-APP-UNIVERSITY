/**
 * Runtime-agnostic core of the AI live-data enrichment.
 * ------------------------------------------------------------------------
 * This module deliberately has NO `server-only` import so it can be shared by
 * both the Next.js server runtime (lib/data/ai-provider.ts) and the standalone
 * batch enrichment script (scripts/06-enrich-ai.ts). Keep it free of any
 * Next-only or env-reading code — the Anthropic client is always passed in.
 */
import type Anthropic from '@anthropic-ai/sdk';
import type { University } from './types';

/** Model used for routine, cost-sensitive enrichment + web search. */
export const ENRICH_MODEL = 'claude-sonnet-4-6';

/** How long an AI-refreshed record stays "fresh" before we refetch. */
export const FRESHNESS_WINDOW_DAYS = 60;

export function isStale(updatedAt?: string): boolean {
  if (!updatedAt) return true;
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  return ageMs > FRESHNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

/** Today's date as ISO YYYY-MM-DD (used to keep deadlines in the future). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * System instructions for the researcher. `today` is injected so the model
 * always returns the NEXT upcoming intake and never a deadline that has
 * already passed.
 */
export function buildEnrichSystem(today: string): string {
  return `You are UNIREAL's data researcher. Given a university, use web search to find ACCURATE, CURRENT facts, preferring the university's official website and its admissions pages.

Today's date is ${today}. For admission, focus on the NEXT upcoming intake (the cycle students can still apply to). Any deadline you return MUST be a date in the future relative to today. If the exact date for the next cycle has not been published yet, give the typical window in "admissionPeriod" and OMIT "admissionDeadline" — never return last year's date.

Return ONLY a single JSON object (no prose, no markdown) with these optional keys — omit any you cannot verify:
{
  "admissionPeriod": string,        // e.g. "May – September"
  "admissionDeadline": string,      // ISO YYYY-MM-DD, MUST be in the future
  "tuitionEur": number,             // typical yearly tuition in EUR (euros) — convert if the source uses another currency
  "size": number,                   // total number of enrolled students
  "programsCount": number,          // number of degree programs offered
  "programs": string[]              // up to 10 notable programs/majors offered
}
Be conservative — never invent figures; omit unknown fields. Deadlines must be ISO YYYY-MM-DD and strictly after ${today}.`;
}

export function buildEnrichPrompt(uni: University, today: string): string {
  return `University: ${uni.name}
Country: ${uni.country}${uni.city ? `, City: ${uni.city}` : ''}
Official website: ${uni.website ?? 'unknown'}

Today is ${today}. Research this university and return the JSON object as instructed, with admission deadlines for the next upcoming intake only.`;
}

export type FreshJson = {
  admissionPeriod?: string;
  admissionDeadline?: string;
  /** Yearly tuition in EUR. */
  tuitionEur?: number;
  /** Total enrolled students. */
  size?: number;
  programsCount?: number;
  programs?: string[];
};

/** Drop any deadline that is not strictly in the future (guards bad model output). */
function futureOnly(deadline: string | undefined, today: string): string | undefined {
  if (!deadline) return undefined;
  return deadline > today ? deadline : undefined;
}

export function toPartialUniversity(
  j: FreshJson,
  today: string = todayISO()
): Partial<University> {
  const out: Partial<University> = {};
  if (j.tuitionEur != null) {
    out.tuition = j.tuitionEur;
    out.tuitionCurrency = 'EUR';
  }
  if (j.size != null) out.size = j.size;
  if (j.programsCount != null) out.programsCount = j.programsCount;
  if (j.programs?.length) out.programs = j.programs.slice(0, 10);

  const admissionDeadline = futureOnly(j.admissionDeadline, today);
  if (j.admissionPeriod || admissionDeadline) {
    out.admission = { period: j.admissionPeriod, deadline: admissionDeadline };
  }
  return out;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Run a single web-search-backed research call and return the assistant's final
 * text. Handles the server-tool `pause_turn` continuation loop. The Anthropic
 * client is passed in so this works in any runtime. Returns null on failure.
 */
export async function researchWithWebSearch(
  client: Anthropic,
  opts: { system: string; prompt: string; maxTokens?: number }
): Promise<string | null> {
  const { system, prompt, maxTokens = 3000 } = opts;
  try {
    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];
    const baseParams = {
      model: ENRICH_MODEL,
      max_tokens: maxTokens,
      // Static instructions cached across calls to cut cost/latency.
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      output_config: { effort: 'low' },
      tools: [{ type: 'web_search_20260209', name: 'web_search' }],
    } as any;

    let response = await client.messages.create({ ...baseParams, messages });

    // Continue the server-side tool loop if it paused.
    let guard = 0;
    while (response.stop_reason === 'pause_turn' && guard++ < 4) {
      messages.push({ role: 'assistant', content: response.content });
      response = await client.messages.create({ ...baseParams, messages });
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    return text || null;
  } catch (e) {
    console.error('researchWithWebSearch failed:', e);
    return null;
  }
}

/**
 * Extract the first JSON value (object OR array) from a model response.
 * Handles code fences and surrounding prose. If an array starts before any
 * object, it is parsed as an array; otherwise as an object.
 */
export function extractJson<T = any>(text: string): T | null {
  const firstObj = text.indexOf('{');
  const firstArr = text.indexOf('[');

  let start: number;
  let close: string;
  if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
    start = firstArr;
    close = ']';
  } else if (firstObj !== -1) {
    start = firstObj;
    close = '}';
  } else {
    return null;
  }

  const end = text.lastIndexOf(close);
  if (end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/**
 * Full enrichment for one university: research the web and return the editorial
 * fields ready to persist (with updatedAt/aiEnriched set). Returns null when the
 * research call or JSON parse fails so callers fall back to cached data.
 */
export async function researchUniversity(
  client: Anthropic,
  uni: University,
  today: string = todayISO()
): Promise<Partial<University> | null> {
  const text = await researchWithWebSearch(client, {
    system: buildEnrichSystem(today),
    prompt: buildEnrichPrompt(uni, today),
  });
  if (!text) return null;
  const json = extractJson<FreshJson>(text);
  if (!json) return null;

  const partial = toPartialUniversity(json, today);
  partial.updatedAt = new Date().toISOString();
  partial.aiEnriched = true;
  return partial;
}
