import type { MetadataRoute } from 'next';
import { repo } from '@/lib/data';
import { locales } from '@/lib/i18n/routing';
import { STUDY_COUNTRIES } from '@/lib/data/countries';
import { STUDY_FIELDS } from '@/lib/data/fields';
import { listPosts } from '@/lib/blog/data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
  const [{ items }, posts] = await Promise.all([
    repo.listUniversities({ page: 1, pageSize: 100000 }),
    listPosts(1000),
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
  for (const uni of items) {
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
