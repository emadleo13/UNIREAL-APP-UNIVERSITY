import type { MetadataRoute } from 'next';
import { repo } from '@/lib/data';
import { locales } from '@/lib/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

function withLocales(path: string) {
  const languages: Record<string, string> = {};
  for (const loc of locales) languages[loc] = `${SITE_URL}/${loc}${path}`;
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { items } = await repo.listUniversities({ page: 1, pageSize: 100000 });

  const staticPaths = ['', '/universities', '/calendar', '/blog', '/contact'];
  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    entries.push({
      url: `${SITE_URL}/${locales[0]}${path}`,
      changeFrequency: 'weekly',
      priority: path === '' ? 1 : 0.8,
      alternates: { languages: withLocales(path) },
    });
  }

  for (const uni of items) {
    const path = `/universities/${uni.slug}`;
    entries.push({
      url: `${SITE_URL}/${locales[0]}${path}`,
      changeFrequency: 'monthly',
      priority: 0.6,
      alternates: { languages: withLocales(path) },
    });
  }

  return entries;
}
