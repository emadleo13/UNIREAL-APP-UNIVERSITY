import 'server-only';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type Post = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  category: string | null;
  sourceUrl: string | null;
  createdAt: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function toPost(r: any): Post {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    summary: r.summary ?? null,
    body: r.body,
    category: r.category ?? null,
    sourceUrl: r.source_url ?? null,
    createdAt: r.created_at,
  };
}

/** Latest published posts. Empty when Supabase isn't configured (mock mode). */
export async function listPosts(limit = 30): Promise<Post[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data ?? []).map(toPost);
  } catch {
    return [];
  }
}

export async function getPost(slug: string): Promise<Post | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();
    return data ? toPost(data) : null;
  } catch {
    return null;
  }
}
