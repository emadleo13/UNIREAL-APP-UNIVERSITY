/**
 * Layer 1 — backbone. Downloads the full Hipolabs university list and turns it
 * into our University[] base (name, country, domains, website, unique slug).
 *
 * Source: https://github.com/Hipo/university-domains-list (MIT, no auth).
 * Run: npm run data:hipolabs
 */
import type { University } from '../lib/data/types';
import { hostFromUrl, slugify, uniqueSlug } from '../lib/data/slug';
import { OUT_FILE, RAW_DIR, ensureDirs, fetchJson, writeJson } from './_util';
import path from 'node:path';

const HIPOLABS_URL =
  'https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json';

type HipoRecord = {
  name: string;
  country: string;
  alpha_two_code: string;
  'state-province': string | null;
  domains: string[];
  web_pages: string[];
};

async function main() {
  await ensureDirs();

  console.log('Fetching Hipolabs dataset…');
  const raw = await fetchJson<HipoRecord[]>(HIPOLABS_URL);
  await writeJson(path.join(RAW_DIR, 'hipolabs.json'), raw);
  console.log(`  got ${raw.length} records`);

  const usedSlugs = new Set<string>();
  const universities: University[] = raw
    .filter((r) => r.name && r.country)
    .map((r) => {
      const website = r.web_pages?.[0];
      const slug = uniqueSlug(slugify(r.name), usedSlugs);
      const domains = Array.from(
        new Set(
          [...(r.domains || []), hostFromUrl(website || '')]
            .filter(Boolean)
            .map((d) => (d as string).toLowerCase())
        )
      );
      const uni: University = {
        id: slug,
        slug,
        name: r.name,
        names_i18n: { en: r.name },
        country: r.country,
        countryCode: (r.alpha_two_code || '').toUpperCase(),
        region: r['state-province'] || undefined,
        website,
        domains,
        source: ['hipolabs'],
      };
      return uni;
    });

  universities.sort((a, b) => a.name.localeCompare(b.name));
  await writeJson(OUT_FILE, universities);
  console.log(`Wrote ${universities.length} universities to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
