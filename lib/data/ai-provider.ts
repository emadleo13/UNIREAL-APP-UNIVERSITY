import 'server-only';
import type { Review, University } from './types';
import { getAnthropic, isAIConfigured } from '@/lib/ai/anthropic';
import { researchUniversity } from './enrich-core';

/**
 * AI LIVE-DATA PROVIDER.
 * ------------------------------------------------------------------------
 * UNIREAL's core promise is *fresh* information. When a university record is
 * stale, we refresh its editorial fields from the live web using Claude
 * (Sonnet 4.6) + the web_search tool, then cache the result in the database.
 *
 * The prompt + parsing live in the runtime-agnostic `enrich-core` module so the
 * batch enrichment script can reuse exactly the same logic.
 *
 * Without an ANTHROPIC_API_KEY the app falls back to the curated overlay — so
 * everything keeps working; freshness just turns on once the key is set.
 */

export { FRESHNESS_WINDOW_DAYS, isStale } from './enrich-core';

/**
 * Fetch fresh editorial fields for a university from the live web.
 * Returns null when AI is not configured or the call fails (callers fall back
 * to cached/overlay data).
 */
export async function fetchFreshUniversityInfo(
  uni: University
): Promise<Partial<University> | null> {
  if (!isAIConfigured()) return null;
  return researchUniversity(getAnthropic(), uni);
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
