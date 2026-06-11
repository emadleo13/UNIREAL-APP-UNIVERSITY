'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { repo } from '@/lib/data';
import type { University } from '@/lib/data/types';
import { getMySubscription } from '@/lib/subscription';
import { FREE_FAVORITES_LIMIT, GUEST_FAVORITES_LIMIT } from '@/lib/limits';

export type ToggleResult = {
  status: 'added' | 'removed' | 'auth' | 'limit' | 'error';
};

/** Add/remove a university from the signed-in user's favorites. */
export async function toggleFavorite(universityId: string): Promise<ToggleResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { status: 'auth' };

    const { data: existing } = await supabase
      .from('favorites')
      .select('university_id')
      .eq('user_id', user.id)
      .eq('university_id', universityId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('university_id', universityId);
      return { status: 'removed' };
    }

    // Free accounts can save up to FREE_FAVORITES_LIMIT; Pro is unlimited.
    const { count } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if ((count ?? 0) >= FREE_FAVORITES_LIMIT) {
      const sub = await getMySubscription();
      if (!sub?.isActive) return { status: 'limit' };
    }

    await supabase
      .from('favorites')
      .insert({ user_id: user.id, university_id: universityId });
    return { status: 'added' };
  } catch (e) {
    console.error('toggleFavorite failed:', e);
    return { status: 'error' };
  }
}

/**
 * Merge favorites saved while signed out (localStorage) into the account,
 * respecting the free/Pro limit. Returns the resulting favorite slugs.
 */
export async function importGuestFavorites(slugs: string[]): Promise<string[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const candidates = [...new Set(slugs)]
      .filter((s) => typeof s === 'string' && s.length > 0 && s.length < 200)
      .slice(0, GUEST_FAVORITES_LIMIT * 2);

    const { data: existing } = await supabase
      .from('favorites')
      .select('university_id')
      .eq('user_id', user.id);
    const have = (existing ?? []).map((r) => r.university_id);
    const haveSet = new Set(have);

    const sub = await getMySubscription();
    const limit = sub?.isActive ? Number.POSITIVE_INFINITY : FREE_FAVORITES_LIMIT;
    const room = Math.max(0, limit - have.length);

    const wanted = candidates.filter((s) => !haveSet.has(s)).slice(0, room);
    if (wanted.length === 0) return have;

    // Keep only ids that actually exist so one bad slug can't fail the insert.
    const { data: valid } = await supabase
      .from('universities')
      .select('id')
      .in('id', wanted);
    const toAdd = (valid ?? []).map((r) => r.id);
    if (toAdd.length === 0) return have;

    await supabase
      .from('favorites')
      .insert(toAdd.map((university_id) => ({ user_id: user.id, university_id })));
    return [...have, ...toAdd];
  } catch (e) {
    console.error('importGuestFavorites failed:', e);
    return [];
  }
}

/** Public university records for the guest saved page (no auth needed). */
export async function getUniversitiesBySlugs(
  slugs: string[]
): Promise<University[]> {
  const clean = [...new Set(slugs)]
    .filter((s) => typeof s === 'string' && s.length > 0 && s.length < 200)
    .slice(0, GUEST_FAVORITES_LIMIT * 2);
  const loaded = await Promise.all(clean.map((s) => repo.getUniversityBySlug(s)));
  return loaded.filter((u): u is University => Boolean(u));
}

/** University ids the signed-in user has saved (empty if signed out). */
export async function getMyFavoriteSlugs(): Promise<string[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('favorites')
      .select('university_id')
      .eq('user_id', user.id);
    return (data ?? []).map((r) => r.university_id);
  } catch {
    return [];
  }
}

/** Full university records for the saved page. */
export async function getMyFavorites(): Promise<University[]> {
  const ids = await getMyFavoriteSlugs();
  if (ids.length === 0) return [];
  const loaded = await Promise.all(ids.map((id) => repo.getUniversityBySlug(id)));
  return loaded.filter((u): u is University => Boolean(u));
}
