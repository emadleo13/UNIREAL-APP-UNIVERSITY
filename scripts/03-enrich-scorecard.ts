/**
 * Layer 3 — US enrichment via College Scorecard (tuition, admission rate, size).
 * Optional: requires a free key from https://api.data.gov/signup/ in SCORECARD_API_KEY.
 *
 * Bulk-pages all schools once, indexes by website host, joins with US universities.
 * Run: SCORECARD_API_KEY=... npm run data:scorecard
 */
import type { University } from '../lib/data/types';
import { hostFromUrl, normalizeDomain } from '../lib/data/slug';
import {
  OUT_FILE,
  RAW_DIR,
  ensureDirs,
  fetchJson,
  readJson,
  sleep,
  writeJson,
} from './_util';
import path from 'node:path';

type ScorecardRow = {
  id: number;
  'school.name': string;
  'school.school_url': string | null;
  'latest.cost.tuition.out_of_state': number | null;
  'latest.admissions.admission_rate.overall': number | null;
  'latest.student.size': number | null;
};

const FIELDS = [
  'id',
  'school.name',
  'school.school_url',
  'latest.cost.tuition.out_of_state',
  'latest.admissions.admission_rate.overall',
  'latest.student.size',
].join(',');

async function fetchAll(key: string): Promise<ScorecardRow[]> {
  const cacheFile = path.join(RAW_DIR, 'scorecard.json');
  const cached = await readJson<ScorecardRow[]>(cacheFile, []);
  if (cached.length > 0) {
    console.log(`  using cached Scorecard rows (${cached.length})`);
    return cached;
  }
  const all: ScorecardRow[] = [];
  let page = 0;
  for (;;) {
    const url =
      `https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${key}` +
      `&fields=${FIELDS}&per_page=100&page=${page}`;
    const res = await fetchJson<{
      metadata: { total: number; page: number; per_page: number };
      results: ScorecardRow[];
    }>(url);
    all.push(...res.results);
    const { total, per_page } = res.metadata;
    page++;
    if (page % 10 === 0) console.log(`  fetched ${all.length}/${total}…`);
    if (page * per_page >= total || res.results.length === 0) break;
    await sleep(120);
  }
  await writeJson(cacheFile, all);
  return all;
}

async function main() {
  const key = process.env.SCORECARD_API_KEY;
  if (!key) {
    console.log(
      'SCORECARD_API_KEY not set — skipping US enrichment (this step is optional).'
    );
    return;
  }
  await ensureDirs();

  const universities = await readJson<University[]>(OUT_FILE, []);
  if (universities.length === 0) {
    throw new Error('No universities found. Run `npm run data:hipolabs` first.');
  }

  console.log('Fetching College Scorecard…');
  const rows = await fetchAll(key);
  const idx = new Map<string, ScorecardRow>();
  for (const row of rows) {
    const host = hostFromUrl(row['school.school_url'] || '');
    if (host) idx.set(host, row);
  }
  console.log(`Indexed ${idx.size} US schools by host.`);

  let matched = 0;
  for (const uni of universities) {
    if (uni.countryCode !== 'US') continue;
    const candidates = [
      hostFromUrl(uni.website || ''),
      ...uni.domains.map(normalizeDomain),
    ].filter(Boolean) as string[];
    const row = candidates.map((h) => idx.get(h)).find(Boolean);
    if (!row) continue;
    matched++;
    if (row['latest.cost.tuition.out_of_state'] != null)
      uni.tuition = row['latest.cost.tuition.out_of_state'];
    if (row['latest.admissions.admission_rate.overall'] != null)
      uni.admissionRate = row['latest.admissions.admission_rate.overall'];
    if (row['latest.student.size'] != null)
      uni.size = row['latest.student.size'];
    if (!uni.source.includes('scorecard')) uni.source.push('scorecard');
  }

  await writeJson(OUT_FILE, universities);
  console.log(`Enriched ${matched} US universities via Scorecard.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
