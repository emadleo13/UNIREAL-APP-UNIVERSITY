/**
 * Layer 4 — fill gaps via Wikidata (logo, founding year, student count, fa/ro labels).
 * Optional. Uses wbgetentities batched 50 ids per call (efficient, CC0).
 * Run: npm run data:wikidata
 */
import type { University } from '../lib/data/types';
import { ensureDirs, fetchJson, readJson, sleep, writeJson, OUT_FILE } from './_util';

type Entity = {
  labels?: Record<string, { value: string }>;
  claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value: unknown } } }>>;
};

function claimString(entity: Entity, prop: string): string | undefined {
  const v = entity.claims?.[prop]?.[0]?.mainsnak?.datavalue?.value;
  return typeof v === 'string' ? v : undefined;
}

function claimYear(entity: Entity, prop: string): number | undefined {
  const v = entity.claims?.[prop]?.[0]?.mainsnak?.datavalue?.value as
    | { time?: string }
    | undefined;
  const t = v?.time; // e.g. "+1885-00-00T00:00:00Z"
  if (!t) return undefined;
  const m = t.match(/([+-]\d+)-/);
  return m ? Math.abs(Number(m[1])) : undefined;
}

function claimQuantity(entity: Entity, prop: string): number | undefined {
  const v = entity.claims?.[prop]?.[0]?.mainsnak?.datavalue?.value as
    | { amount?: string }
    | undefined;
  if (!v?.amount) return undefined;
  const n = Number(v.amount.replace('+', ''));
  return Number.isFinite(n) ? n : undefined;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  await ensureDirs();
  const universities = await readJson<University[]>(OUT_FILE, []);
  const targets = universities.filter((u) => u.wikidataId);
  if (targets.length === 0) {
    console.log('No universities have a Wikidata id yet — run enrich step first.');
    return;
  }

  const byQid = new Map(targets.map((u) => [u.wikidataId!, u]));
  const batches = chunk([...byQid.keys()], 50);
  let enriched = 0;

  for (let i = 0; i < batches.length; i++) {
    const ids = batches[i].join('|');
    const url =
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids}` +
      `&props=labels|claims&languages=en|fa|ro&format=json&origin=*`;
    const res = await fetchJson<{ entities: Record<string, Entity> }>(url);

    for (const [qid, entity] of Object.entries(res.entities)) {
      const uni = byQid.get(qid);
      if (!uni) continue;
      enriched++;

      uni.names_i18n = {
        en: uni.names_i18n?.en || entity.labels?.en?.value,
        fa: uni.names_i18n?.fa || entity.labels?.fa?.value,
        ro: uni.names_i18n?.ro || entity.labels?.ro?.value,
      };
      const year = claimYear(entity, 'P571');
      if (year && !uni.establishedYear) uni.establishedYear = year;
      const students = claimQuantity(entity, 'P2196');
      if (students && !uni.size) uni.size = students;
      if (!uni.logoUrl) {
        const logo = claimString(entity, 'P154') || claimString(entity, 'P18');
        if (logo) {
          uni.logoUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
            logo
          )}`;
        }
      }
      if (!uni.source.includes('wikidata')) uni.source.push('wikidata');
    }
    if ((i + 1) % 5 === 0) console.log(`  processed ${enriched} entities…`);
    await sleep(200);
  }

  await writeJson(OUT_FILE, universities);
  console.log(`Enriched ${enriched} universities via Wikidata.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
