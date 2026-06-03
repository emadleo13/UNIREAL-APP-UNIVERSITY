'use server';

import { revalidatePath } from 'next/cache';
import { repo } from '@/lib/data';
import { fetchFreshUniversityInfo, isStale } from '@/lib/data/ai-provider';
import { isAIConfigured } from '@/lib/ai/anthropic';

/**
 * On-view freshness refresh. Called (non-blocking) from the university detail
 * page after it renders. If the record is stale and AI is configured, it pulls
 * fresh data from the live web, persists it, and revalidates the page so the
 * next view shows current information.
 *
 * Returns quickly with { refreshed: false } when nothing to do — so it's cheap
 * to call on every view.
 */
export async function refreshUniversityIfStale(
  slug: string,
  locale: string
): Promise<{ refreshed: boolean }> {
  if (!isAIConfigured()) return { refreshed: false };

  const uni = await repo.getUniversityBySlug(slug);
  if (!uni || !isStale(uni.updatedAt)) return { refreshed: false };

  const fresh = await fetchFreshUniversityInfo(uni);
  if (!fresh) return { refreshed: false };

  await repo.saveUniversityFresh(slug, fresh);
  revalidatePath(`/${locale}/universities/${slug}`);
  return { refreshed: true };
}
