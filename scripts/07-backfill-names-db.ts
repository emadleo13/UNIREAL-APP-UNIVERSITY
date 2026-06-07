/**
 * Backfill localized university names (names_i18n) on the LIVE Supabase DB from
 * Wikidata labels — free, CC0, high quality. Focus: Romanian + a cleaner
 * English display name (and Persian where Wikidata happens to have it).
 *
 * Why: most DB rows only carry an English `name`, so Romanian (and Persian)
 * searches and page titles don't match the real local name. Wikidata has the
 * native `ro`/`en` labels for the ~3500 rows that already store a wikidata_id.
 *
 * Safe: only writes the `names_i18n` column (no trigger touches updated_at, so
 * editorial AI-enrichment freshness is unaffected). Never overwrites a locale
 * that is already present. Re-runnable.
 *
 * Usage (vars read from .env.local / .env automatically):
 *   npx tsx scripts/07-backfill-names-db.ts --countries=Romania --dry-run
 *   npx tsx scripts/07-backfill-names-db.ts --countries=Romania,Bulgaria,Hungary,Poland
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
  names_i18n: { en?: string; ro?: string; fa?: string } | null;
  wikidata_id: string | null;
};
type Entity = { labels?: Record<string, { value: string }> };

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

/** Fetch every matching row, paging past Supabase's 1000-row cap. */
async function fetchRows(): Promise<Row[]> {
  const rows: Row[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    let q = supabase
      .from('universities')
      .select('id, name, names_i18n, wikidata_id')
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

async function main() {
  console.log(
    `Backfilling names from Wikidata${countries ? ` for ${countries.join(', ')}` : ' (all rows with wikidata_id)'}${dryRun ? ' [DRY RUN]' : ''}…`
  );
  const rows = await fetchRows();
  console.log(`  ${rows.length} universities with a wikidata_id`);
  if (rows.length === 0) return;

  const byQid = new Map(rows.map((r) => [r.wikidata_id!, r]));
  const batches = chunk([...byQid.keys()], 50);
  let updated = 0;
  let addedRo = 0;
  let addedFa = 0;
  let improvedEn = 0;

  for (let i = 0; i < batches.length; i++) {
    const ids = batches[i].join('|');
    const apiUrl =
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids}` +
      `&props=labels&languages=en|fa|ro&format=json&origin=*`;
    const res = await fetchJson<{ entities: Record<string, Entity> }>(apiUrl);

    const updates: Array<{ id: string; names_i18n: Row['names_i18n'] }> = [];
    for (const [qid, entity] of Object.entries(res.entities)) {
      const row = byQid.get(qid);
      if (!row) continue;
      const cur = row.names_i18n ?? {};
      const next = { ...cur };
      const wd = entity.labels;
      let changed = false;

      // Romanian — authoritative local name.
      if (!next.ro && wd?.ro?.value) {
        next.ro = wd.ro.value;
        addedRo++;
        changed = true;
      }
      // Persian — only when Wikidata happens to have it (no AI, free).
      if (!next.fa && wd?.fa?.value) {
        next.fa = wd.fa.value;
        addedFa++;
        changed = true;
      }
      // English — a cleaner display name than the raw pipeline `name`.
      if (wd?.en?.value && wd.en.value !== row.name && next.en !== wd.en.value) {
        next.en = wd.en.value;
        improvedEn++;
        changed = true;
      }

      if (changed) updates.push({ id: row.id, names_i18n: next });
    }

    if (!dryRun) {
      // Limited concurrency to be gentle on the DB.
      for (const group of chunk(updates, 10)) {
        await Promise.all(
          group.map((u) =>
            supabase
              .from('universities')
              .update({ names_i18n: u.names_i18n })
              .eq('id', u.id)
              .then(({ error }) => {
                if (error) console.warn(`  update ${u.id} failed: ${error.message}`);
              })
          )
        );
      }
    }
    updated += updates.length;
    process.stdout.write(
      `\r  batch ${i + 1}/${batches.length} — ${updated} rows updated`
    );
    await sleep(150); // polite to Wikidata
  }

  console.log(
    `\nDone. ${updated} rows ${dryRun ? 'would be ' : ''}updated · +${addedRo} ro · +${addedFa} fa · ${improvedEn} en improved.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
