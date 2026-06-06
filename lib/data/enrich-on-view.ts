import 'server-only';
import { repo } from '@/lib/data';
import { fetchFreshUniversityInfo } from './ai-provider';
import type { University } from './types';

/**
 * First-view synchronous enrichment — the guarantee that a visitor NEVER lands
 * on an empty university page.
 *
 * If the record has never been enriched (no `updatedAt`), we research it from
 * the live web *before rendering*, persist the result, and return the merged
 * record. The first visitor waits a few seconds (the route shows a skeleton via
 * loading.tsx); every visitor after that is instant because the data is cached
 * in the database.
 *
 * Already-enriched records return immediately — staleness is handled out-of-band
 * by the background refresher so those pages stay fast.
 *
 * Always falls back to the cached record (or null) when AI is unavailable or the
 * research call fails, so the page still renders.
 */
export async function getEnrichedUniversity(
  slug: string
): Promise<University | null> {
  const uni = await repo.getUniversityBySlug(slug);
  if (!uni) return null;

  // Already has editorial data — render immediately.
  if (uni.updatedAt) return uni;

  const fresh = await fetchFreshUniversityInfo(uni);
  if (!fresh) return uni;

  await repo.saveUniversityFresh(slug, fresh);
  return { ...uni, ...fresh };
}
