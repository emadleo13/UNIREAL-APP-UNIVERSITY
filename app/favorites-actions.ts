'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { repo } from '@/lib/data';
import type { University } from '@/lib/data/types';

export type ToggleResult = { status: 'added' | 'removed' | 'auth' | 'error' };

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

    await supabase
      .from('favorites')
      .insert({ user_id: user.id, university_id: universityId });
    return { status: 'added' };
  } catch (e) {
    console.error('toggleFavorite failed:', e);
    return { status: 'error' };
  }
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
