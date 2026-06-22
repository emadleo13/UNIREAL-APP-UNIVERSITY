import type { MetadataRoute } from 'next';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { locales } from '@/lib/i18n/routing';
import { STUDY_COUNTRIES } from '@/lib/data/countries';
import { STUDY_FIELDS } from '@/lib/data/fields';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Supabase/PostgREST caps each response at 1000 rows regardless of the
// requested range, so the full catalogue must be fetched page by page.
const DB_PAGE_SIZE = 1000;

// Regenerate at most once a day instead of on every crawler hit.
//
// IMPORTANT: this `revalidate` only takes effect while the route stays
// statically renderable. The data below is therefore read through the
// service-role ADMIN client, NOT the cookie-bound server client — reading
// `cookies()` would opt the whole sitemap into dynamic rendering and silently
// disable this ISR cache (which is exactly what used to make the 5.4 MB sitemap
// regenerate on every request and tip the uptime monitor over its threshold).
export const revalidate = 86400;

type SlugRow = { slug: string; updated_at?: string | null; created_at?: string | null };

/** All university slugs + last-modified, paged through with the admin client. */
async function listAllUniversitySlugs(): Promise<
  { slug: string; updatedAt?: string }[]
> {
  if (!isSupabaseConfigured()) return [];
  const admin = createSupabaseAdminClient();
  const all: { slug: string; updatedAt?: string }[] = [];
  for (let page = 0; ; page++) {
    const from = page * DB_PAGE_SIZE;
    const { data, error } = await admin
      .from('universities')
      .select('slug, updated_at')
      .order('slug', { ascending: true })
      .range(from, from + DB_PAGE_SIZE - 1);
    if (error) throw error;
    const rows = (data ?? []) as SlugRow[];
    for (const r of rows) {
      if (r.slug) all.push({ slug: r.slug, updatedAt: r.updated_at ?? undefined });
    }
    if (rows.length < DB_PAGE_SIZE) break;
  }
  return all;
}

/** Published blog post slugs + creation date, via the admin client. */
async function listPublishedPostSlugs(): Promise<
  { slug: string; createdAt?: string }[]
> {
  if (!isSupabaseConfigured()) return [];
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('posts')
    .select('slug, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return ((data ?? []) as SlugRow[])
    .filter((r) => r.slug)
    .map((r) => ({ slug: r.slug, createdAt: r.created_at ?? undefined }));
}

function withLocales(path: string) {
  const languages: Record<string, string> = {};
  for (const loc of locales) languages[loc] = `${SITE_URL}/${loc}${path}`;
  return languages;
}

function entry(
  path: string,
  opts: {
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
    lastModified?: string | Date;
  }
): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}/${locales[0]}${path}`,
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages: withLocales(path) },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [universities, posts] = await Promise.all([
    listAllUniversitySlugs(),
    listPublishedPostSlugs(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  // Static pages.
  entries.push(entry('', { changeFrequency: 'weekly', priority: 1 }));
  for (const path of ['/universities', '/calendar', '/blog', '/contact']) {
    entries.push(entry(path, { changeFrequency: 'weekly', priority: 0.8 }));
  }
  entries.push(entry('/fields', { changeFrequency: 'weekly', priority: 0.8 }));
  entries.push(entry('/scholarships', { changeFrequency: 'monthly', priority: 0.8 }));
  entries.push(entry('/quiz', { changeFrequency: 'monthly', priority: 0.6 }));

  // Study-in country hubs — high-intent landing pages.
  for (const c of STUDY_COUNTRIES) {
    entries.push(
      entry(`/study-in/${c.slug}`, { changeFrequency: 'weekly', priority: 0.7 })
    );
  }

  // Per-country ranking pages ("10 best / cheapest universities in X").
  for (const c of STUDY_COUNTRIES) {
    entries.push(
      entry(`/rankings/${c.slug}`, { changeFrequency: 'weekly', priority: 0.7 })
    );
    entries.push(
      entry(`/rankings/${c.slug}/affordable`, {
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    );
  }

  // Field-of-study hubs and field × country landing pages
  // ("Study Medicine in Romania").
  for (const f of STUDY_FIELDS) {
    entries.push(
      entry(`/fields/${f.slug}`, { changeFrequency: 'weekly', priority: 0.7 })
    );
    for (const c of STUDY_COUNTRIES) {
      entries.push(
        entry(`/fields/${f.slug}/${c.slug}`, {
          changeFrequency: 'weekly',
          priority: 0.65,
        })
      );
    }
  }

  // University profiles.
  for (const uni of universities) {
    entries.push(
      entry(`/universities/${uni.slug}`, {
        changeFrequency: 'monthly',
        priority: 0.6,
        lastModified: uni.updatedAt,
      })
    );
  }

  // Blog posts.
  for (const post of posts) {
    entries.push(
      entry(`/blog/${post.slug}`, {
        changeFrequency: 'monthly',
        priority: 0.5,
        lastModified: post.createdAt,
      })
    );
  }

  return entries;
}
