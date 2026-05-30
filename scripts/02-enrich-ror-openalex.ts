/**
 * Layer 2 — enrichment via OpenAlex (which embeds ROR + Wikidata ids).
 *
 * Instead of thousands of per-university calls, we bulk-page through all
 * education institutions once, index them by homepage host, then join locally
 * with our backbone by website host / domain. This adds: ROR id, Wikidata id,
 * OpenAlex id, geo coordinates, logo, MULTILINGUAL names (fa/ro!), and a
 * CC0 research-activity score.
 *
 * Source: https://api.openalex.org/institutions (CC0).
 * Run: npm run data:enrich    (optional: --max-pages=50 to bound)
 */
import type { University } from '../lib/data/types';
import { hostFromUrl, normalizeDomain } from '../lib/data/slug';
import {
  OUT_FILE,
  RAW_DIR,
  arg,
  ensureDirs,
  fetchJson,
  readJson,
  researchScoreFromWorks,
  sleep,
  writeJson,
} from './_util';
import path from 'node:path';

type OAInstitution = {
  id: string;
  ror?: string;
  display_name: string;
  international?: { display_name?: Record<string, string> };
  homepage_url?: string;
  image_url?: string;
  geo?: { latitude?: number; longitude?: number };
  works_count?: number;
  cited_by_count?: number;
  ids?: { wikidata?: string; ror?: string; openalex?: string };
};

const SELECT =
  'id,ror,display_name,international,homepage_url,image_url,geo,works_count,cited_by_count,ids';

async function fetchAllInstitutions(maxPages: number): Promise<OAInstitution[]> {
  const cacheFile = path.join(RAW_DIR, 'openalex-institutions.json');
  const cached = await readJson<OAInstitution[]>(cacheFile, []);
  if (cached.length > 0) {
    console.log(`  using cached OpenAlex institutions (${cached.length})`);
    return cached;
  }

  const all: OAInstitution[] = [];
  let cursor = '*';
  let page = 0;
  while (cursor && (maxPages <= 0 || page < maxPages)) {
    const url =
      `https://api.openalex.org/institutions?filter=type:education` +
      `&per-page=200&select=${SELECT}&cursor=${encodeURIComponent(cursor)}`;
    const res = await fetchJson<{
      results: OAInstitution[];
      meta: { next_cursor: string | null };
    }>(url);
    all.push(...res.results);
    cursor = res.meta.next_cursor || '';
    page++;
    if (page % 10 === 0) console.log(`  fetched ${all.length} institutions…`);
    await sleep(120); // polite
  }
  await writeJson(cacheFile, all);
  console.log(`  cached ${all.length} OpenAlex institutions`);
  return all;
}

function wikidataId(inst: OAInstitution): string | undefined {
  const w = inst.ids?.wikidata;
  if (!w) return undefined;
  const m = w.match(/Q\d+/);
  return m ? m[0] : undefined;
}

function indexByHost(institutions: OAInstitution[]): Map<string, OAInstitution> {
  const idx = new Map<string, OAInstitution>();
  for (const inst of institutions) {
    const host = hostFromUrl(inst.homepage_url || '');
    if (!host) continue;
    const existing = idx.get(host);
    if (!existing || (inst.works_count || 0) > (existing.works_count || 0)) {
      idx.set(host, inst);
    }
  }
  return idx;
}

function match(
  uni: University,
  idx: Map<string, OAInstitution>
): OAInstitution | undefined {
  const candidates = [
    hostFromUrl(uni.website || ''),
    ...uni.domains.map(normalizeDomain),
  ].filter(Boolean) as string[];
  for (const host of candidates) {
    const hit = idx.get(host);
    if (hit) return hit;
    // try parent domain (e.g. cs.mit.edu -> mit.edu)
    const parts = host.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
      const parent = parts.slice(i).join('.');
      const phit = idx.get(parent);
      if (phit) return phit;
    }
  }
  return undefined;
}

async function main() {
  await ensureDirs();
  const maxPages = Number(arg('max-pages', '0'));

  const universities = await readJson<University[]>(OUT_FILE, []);
  if (universities.length === 0) {
    throw new Error('No universities found. Run `npm run data:hipolabs` first.');
  }

  console.log('Fetching OpenAlex institutions…');
  const institutions = await fetchAllInstitutions(maxPages);
  const idx = indexByHost(institutions);
  console.log(`Indexed ${idx.size} institutions by host.`);

  let matched = 0;
  for (const uni of universities) {
    const inst = match(uni, idx);
    if (!inst) continue;
    matched++;

    const intl = inst.international?.display_name || {};
    uni.names_i18n = {
      en: intl.en || uni.names_i18n?.en || inst.display_name,
      ro: intl.ro || uni.names_i18n?.ro,
      fa: intl.fa || uni.names_i18n?.fa,
    };
    uni.openAlexId = inst.id;
    uni.rorId = inst.ror || inst.ids?.ror || uni.rorId;
    uni.wikidataId = wikidataId(inst) || uni.wikidataId;
    if (inst.image_url) uni.logoUrl = inst.image_url;
    if (inst.geo?.latitude != null && inst.geo?.longitude != null) {
      uni.geo = { lat: inst.geo.latitude, lng: inst.geo.longitude };
    }
    const score = researchScoreFromWorks(inst.works_count);
    if (score != null) uni.researchScore = score;

    const sources = new Set(uni.source);
    sources.add('openalex');
    if (uni.rorId) sources.add('ror');
    uni.source = Array.from(sources);
  }

  await writeJson(OUT_FILE, universities);
  console.log(
    `Enriched ${matched}/${universities.length} universities via OpenAlex.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
