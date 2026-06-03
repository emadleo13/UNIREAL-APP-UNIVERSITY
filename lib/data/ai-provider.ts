import 'server-only';
import type { Review, University } from './types';
import {
  isAIConfigured,
  researchWithWebSearch,
  extractJson,
} from '@/lib/ai/anthropic';

/**
 * AI LIVE-DATA PROVIDER.
 * ------------------------------------------------------------------------
 * UNIREAL's core promise is *fresh* information. When a university record is
 * stale, we refresh its editorial fields from the live web using Claude
 * (Sonnet 4.6) + the web_search tool, then cache the result in the database.
 *
 * Without an ANTHROPIC_API_KEY the app falls back to the curated overlay — so
 * everything keeps working; freshness just turns on once the key is set.
 */

/** How long an AI-refreshed record stays "fresh" before we refetch. */
export const FRESHNESS_WINDOW_DAYS = 30;

export function isStale(updatedAt?: string): boolean {
  if (!updatedAt) return true;
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  return ageMs > FRESHNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

const SYSTEM = `You are UNIREAL's data researcher. Given a university, use web search to find ACCURATE, CURRENT facts, preferring the university's official website and its international-students pages.

Return ONLY a single JSON object (no prose, no markdown) with these optional keys — omit any you cannot verify:
{
  "description_en": string, "description_fa": string, "description_ro": string,
  "programsCount": number,
  "programs": string[],                      // up to 10 notable programs/majors
  "tuition": number,                          // yearly domestic tuition, USD
  "admissionPeriod": string,                  // e.g. "Sep 1 – Jan 5"
  "admissionDeadline": string,                // ISO YYYY-MM-DD
  "internationalUrl": string,                 // official international-students page
  "intlAdmissionPeriod": string,
  "intlDeadline": string,                     // ISO YYYY-MM-DD
  "intlTuition": number,                      // yearly tuition for international students, USD
  "intlProgramsCount": number,                // programs taught in an international language
  "intlLanguages": string[]
}
Descriptions: 2–3 sentences each. Be conservative — never invent figures; omit unknown fields.`;

type FreshJson = {
  description_en?: string;
  description_fa?: string;
  description_ro?: string;
  programsCount?: number;
  programs?: string[];
  tuition?: number;
  admissionPeriod?: string;
  admissionDeadline?: string;
  internationalUrl?: string;
  intlAdmissionPeriod?: string;
  intlDeadline?: string;
  intlTuition?: number;
  intlProgramsCount?: number;
  intlLanguages?: string[];
};

function toPartialUniversity(j: FreshJson): Partial<University> {
  const out: Partial<University> = {};
  const desc: Record<string, string> = {};
  if (j.description_en) desc.en = j.description_en;
  if (j.description_fa) desc.fa = j.description_fa;
  if (j.description_ro) desc.ro = j.description_ro;
  if (Object.keys(desc).length) out.description_i18n = desc;
  if (j.programsCount != null) out.programsCount = j.programsCount;
  if (j.programs?.length) out.programs = j.programs.slice(0, 10);
  if (j.tuition != null) out.tuition = j.tuition;
  if (j.admissionPeriod || j.admissionDeadline) {
    out.admission = { period: j.admissionPeriod, deadline: j.admissionDeadline };
  }
  if (j.internationalUrl) out.internationalUrl = j.internationalUrl;
  if (
    j.intlAdmissionPeriod ||
    j.intlDeadline ||
    j.intlTuition != null ||
    j.intlProgramsCount != null ||
    j.intlLanguages?.length
  ) {
    out.international = {
      admissionPeriod: j.intlAdmissionPeriod,
      deadline: j.intlDeadline,
      tuition: j.intlTuition,
      programsCount: j.intlProgramsCount,
      languages: j.intlLanguages,
    };
  }
  return out;
}

/**
 * Fetch fresh editorial fields for a university from the live web.
 * Returns null when AI is not configured or the call fails (callers fall back
 * to cached/overlay data).
 */
export async function fetchFreshUniversityInfo(
  uni: University
): Promise<Partial<University> | null> {
  if (!isAIConfigured()) return null;

  const prompt = `University: ${uni.name}
Country: ${uni.country}${uni.city ? `, City: ${uni.city}` : ''}
Official website: ${uni.website ?? 'unknown'}

Research this university and return the JSON object as instructed.`;

  const text = await researchWithWebSearch({ system: SYSTEM, prompt });
  if (!text) return null;
  const json = extractJson<FreshJson>(text);
  if (!json) return null;

  const partial = toPartialUniversity(json);
  partial.updatedAt = new Date().toISOString();
  partial.aiEnriched = true;
  return partial;
}

/**
 * Aggregate fresh public reviews for a university.
 * PLACEHOLDER: review aggregation will reuse the same engine; for now we keep
 * the curated/seeded reviews. Returns null so callers use stored reviews.
 */
export async function fetchAggregatedReviews(
  _uni: University
): Promise<Review[] | null> {
  return null;
}
