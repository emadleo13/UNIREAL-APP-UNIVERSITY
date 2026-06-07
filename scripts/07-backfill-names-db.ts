/**
 * Backfill localized university names + city on the LIVE Supabase DB from
 * Wikidata (free, CC0, high quality).
 *
 * - names_i18n: real/clean English display name (fixes typos/colloquial names,
 *   e.g. "University of Iasi" -> "Alexandru Ioan Cuza University"), plus
 *   Romanian/Persian labels where Wikidata has them.
 * - city: every DB row had a NULL city; we resolve P131 (located in the
 *   administrative territorial entity) to a city name. Hugely improves page
 *   titles ("<name> — <city>, <country>") and "<name> <city>" search matching.
 *
 * Safe: only writes `names_i18n` and `city` (no trigger touches updated_at, so
 * editorial AI-enrichment freshness is unaffected). Never overwrites a value
 * that is already present. Re-runnable.
 *
 * Usage (vars read from .env.local / .env automatically):
 *   npx tsx scripts/07-backfill-names-db.ts --countries=Romania --dry-run
 *   npx tsx scripts/07-backfill-names-db.ts --countries=Romania,Bulgaria,Poland
 *   npx tsx scripts/07-backfill-names-db.ts            # ALL rows with a wikidata_id
 *   npx tsx scripts/07-backfill-names-db.ts --limit=200
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import { readFileSync, existsSync } from 'node:fs';
import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';
import { fetchJson, sleep, arg } from './_util';

for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket as never },
});

type Row = {
  id: string;
  name: string;
  city: string | null;
  names_i18n: { en?: string; ro?: string; fa?: string } | null;
  wikidata_id: string | null;
};
type Entity = {
  labels?: Record<string, { value: string }>;
  claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value?: { id?: string } } } }>>;
};

const dryRun = process.argv.includes('--dry-run');
const limit = arg('limit') ? Number(arg('limit')) : undefined;
const countries = arg('countries')
  ?.split(',')
  .map((c) => c.trim())
  .filter(Boolean);

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function claimId(entity: Entity, prop: string): string | undefined {
  return entity.claims?.[prop]?.[0]?.mainsnak?.datavalue?.value?.id;
}

async function fetchRows(): Promise<Row[]> {
  const rows: Row[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    let q = supabase
      .from('universities')
      .select('id, name, city, names_i18n, wikidata_id')
      .not('wikidata_id', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (countries?.length) q = q.in('country', countries);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...(data as Row[]));
    if (data.length < PAGE) break;
    if (limit && rows.length >= limit) break;
  }
  return limit ? rows.slice(0, limit) : rows;
}

/** Resolve a set of place Q-ids to their best display name (en → ro). */
async function resolveCityNames(qids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const batch of chunk(qids, 50)) {
    const apiUrl =
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batch.join('|')}` +
      `&props=labels&languages=en|ro|fa&format=json&origin=*`;
    const res = await fetchJson<{ entities: Record<string, Entity> }>(apiUrl);
    for (const [qid, ent] of Object.entries(res.entities)) {
      const name = ent.labels?.en?.value || ent.labels?.ro?.value;
      if (name) out.set(qid, name);
    }
    await sleep(150);
  }
  return out;
}

async function main() {
  console.log(
    `Backfilling names + city from Wikidata${countries ? ` for ${countries.join(', ')}` : ' (all rows with wikidata_id)'}${dryRun ? ' [DRY RUN]' : ''}…`
  );
  const rows = await fetchRows();
  console.log(`  ${rows.length} universities with a wikidata_id`);
  if (rows.length === 0) return;

  const byQid = new Map(rows.map((r) => [r.wikidata_id!, r]));
  const batches = chunk([...byQid.keys()], 50);

  // rowId -> place Q-id we still need to resolve to a city name.
  const cityQidByRow = new Map<string, string>();
  let nameUpdated = 0;
  let addedRo = 0;
  let addedFa = 0;
  let improvedEn = 0;

  for (let i = 0; i < batches.length; i++) {
    const apiUrl =
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batches[i].join('|')}` +
      `&props=labels|claims&languages=en|fa|ro&format=json&origin=*`;
    const res = await fetchJson<{ entities: Record<string, Entity> }>(apiUrl);

    const nameUpdates: Array<{ id: string; names_i18n: Row['names_i18n'] }> = [];
    for (const [qid, entity] of Object.entries(res.entities)) {
      const row = byQid.get(qid);
      if (!row) continue;
      const cur = row.names_i18n ?? {};
      const next = { ...cur };
      const wd = entity.labels;
      let changed = false;
      if (!next.ro && wd?.ro?.value) (next.ro = wd.ro.value), addedRo++, (changed = true);
      if (!next.fa && wd?.fa?.value) (next.fa = wd.fa.value), addedFa++, (changed = true);
      if (wd?.en?.value && wd.en.value !== row.name && next.en !== wd.en.value) {
        next.en = wd.en.value;
        improvedEn++;
        changed = true;
      }
      if (changed) nameUpdates.push({ id: row.id, names_i18n: next });

      // City: only when missing. P131 = located in admin territorial entity.
      if (!row.city) {
        const placeQid = claimId(entity, 'P131');
        if (placeQid) cityQidByRow.set(row.id, placeQid);
      }
    }

    if (!dryRun) {
      for (const group of chunk(nameUpdates, 10)) {
        await Promise.all(
          group.map((u) =>
            supabase
              .from('universities')
              .update({ names_i18n: u.names_i18n })
              .eq('id', u.id)
              .then(({ error }) => {
                if (error) console.warn(`  name update ${u.id} failed: ${error.message}`);
              })
          )
        );
      }
    }
    nameUpdated += nameUpdates.length;
    process.stdout.write(`\r  names: batch ${i + 1}/${batches.length} — ${nameUpdated} updated`);
    await sleep(150);
  }
  console.log('');

  // Resolve unique place Q-ids → city names, then write cities.
  const uniqueCityQids = [...new Set(cityQidByRow.values())];
  console.log(`  resolving ${uniqueCityQids.length} unique place ids → city names…`);
  const cityNames = await resolveCityNames(uniqueCityQids);

  const cityUpdates: Array<{ id: string; city: string }> = [];
  for (const [rowId, placeQid] of cityQidByRow) {
    const city = cityNames.get(placeQid);
    if (city) cityUpdates.push({ id: rowId, city });
  }
  if (!dryRun) {
    for (const group of chunk(cityUpdates, 10)) {
      await Promise.all(
        group.map((u) =>
          supabase
            .from('universities')
            .update({ city: u.city })
            .eq('id', u.id)
            .then(({ error }) => {
              if (error) console.warn(`  city update ${u.id} failed: ${error.message}`);
            })
        )
      );
    }
  }

  console.log(
    `Done. names: ${nameUpdated} ${dryRun ? 'would be ' : ''}updated (+${addedRo} ro, +${addedFa} fa, ${improvedEn} en) · city: ${cityUpdates.length} ${dryRun ? 'would be ' : ''}filled.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
