'use server';

import { revalidatePath } from 'next/cache';
import { repo } from '@/lib/data';
import { fetchFreshUniversityInfo, isStale } from '@/lib/data/ai-provider';
import { isAIConfigured } from '@/lib/ai/anthropic';
import {
  acquireEnrichLock,
  checkRateLimit,
  claimAiBudget,
} from '@/lib/rate-limit';

/**
 * On-view freshness refresh. Called (non-blocking) from the university detail
 * page after it renders. If the record is stale and AI is configured, it pulls
 * fresh data from the live web, persists it, and revalidates the page so the
 * next view shows current information.
 *
 * Returns quickly with { refreshed: false } when nothing to do — so it's cheap
 * to call on every view.
 *
 * COST CONTROL. This is a public endpoint that spends money: anyone can call
 * it with any slug, and each stale slug is one Claude web-search call. Three
 * guards stand in front of the model, cheapest first:
 *   1. a per-caller rate limit, so one client can't walk the whole catalogue;
 *   2. a per-slug lock, so simultaneous visitors to the same page pay once;
 *   3. a site-wide daily budget, the backstop against a distributed crawl.
 * Every guard degrades to the cached record — the page still renders, it just
 * isn't refreshed this time.
 */
export async function refreshUniversityIfStale(
  slug: string,
  locale: string
): Promise<{ refreshed: boolean }> {
  if (!isAIConfigured()) return { refreshed: false };
  if (typeof slug !== 'string' || !slug || slug.length > 200) {
    return { refreshed: false };
  }

  const uni = await repo.getUniversityBySlug(slug);
  if (!uni || !isStale(uni.updatedAt)) return { refreshed: false };

  // Past this point a paid call is possible — start charging the guards.
  if (!(await checkRateLimit('refresh'))) return { refreshed: false };
  if (!(await acquireEnrichLock(slug))) return { refreshed: false };
  if (!(await claimAiBudget())) return { refreshed: false };

  const fresh = await fetchFreshUniversityInfo(uni);
  if (!fresh) return { refreshed: false };

  await repo.saveUniversityFresh(slug, fresh);
  revalidatePath(`/${locale}/universities/${slug}`);
  return { refreshed: true };
}
