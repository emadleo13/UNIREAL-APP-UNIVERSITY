import type { Review, University } from './types';

/**
 * AI LIVE-DATA PROVIDER (placeholder seam).
 * ------------------------------------------------------------------------
 * UNIREAL's core promise is *fresh* information — stale data means clients
 * won't subscribe. The plan is to refresh each university's editorial fields
 * (description, admission windows, tuition, programs, international links) and
 * aggregate public reviews on demand using a Claude model (Sonnet for routine
 * refreshes, Opus for deeper aggregation) with web access, then cache the
 * result in the database.
 *
 * NOTHING here calls the network yet. Until the database + Claude API key are
 * wired up (next phase), these functions return `null` and the app falls back
 * to the curated overlay in `data/university-details.json`. The repository is
 * already written to prefer a fresh AI result when one exists, so turning this
 * on later is a drop-in change.
 *
 * Next-phase implementation outline (see lib/data/README when added):
 *   1. Check the DB cache; if `updatedAt` is within the freshness window, use it.
 *   2. Otherwise call Claude (claude-sonnet-4-6 / claude-opus-4-8) with web
 *      tools + structured tool-use to extract the fields below from the
 *      university's official site, its international-students section, and
 *      public review sources (Google, Reddit, Niche, …).
 *   3. Persist the result with a fresh `updatedAt`, then return it.
 *   4. Use prompt caching on the static instruction block to keep costs low.
 */

/** How long an AI-refreshed record stays "fresh" before we refetch. */
export const FRESHNESS_WINDOW_DAYS = 30;

export function isStale(updatedAt?: string): boolean {
  if (!updatedAt) return true;
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  return ageMs > FRESHNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Fetch fresh editorial fields for a university from live sources.
 * PLACEHOLDER: returns null (no live provider configured yet).
 */
export async function fetchFreshUniversityInfo(
  _uni: University
): Promise<Partial<University> | null> {
  // TODO(ai): call Claude with web access + structured output, cache to DB.
  return null;
}

/**
 * Aggregate fresh public reviews for a university from multiple sources.
 * PLACEHOLDER: returns null (no live provider configured yet).
 */
export async function fetchAggregatedReviews(
  _uni: University
): Promise<Review[] | null> {
  // TODO(ai): call Claude to gather + summarize reviews from Google/Reddit/etc.
  return null;
}
