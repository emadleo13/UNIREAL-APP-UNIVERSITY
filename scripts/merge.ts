/**
 * Finalizer — validates, dedupes and sorts the merged dataset, then prints stats.
 * Run last in the pipeline: npm run data:merge
 */
import type { University } from '../lib/data/types';
import { OUT_FILE, readJson, writeJson } from './_util';

async function main() {
  const universities = await readJson<University[]>(OUT_FILE, []);
  if (universities.length === 0) {
    throw new Error('No universities found. Run the pipeline first.');
  }

  // Dedupe by slug (keep the most-enriched record).
  const bySlug = new Map<string, University>();
  for (const u of universities) {
    const existing = bySlug.get(u.slug);
    if (!existing || u.source.length > existing.source.length) {
      bySlug.set(u.slug, u);
    }
  }

  const cleaned = [...bySlug.values()]
    .filter((u) => u.name && u.slug && u.country)
    .sort((a, b) => {
      const sa = a.researchScore ?? -1;
      const sb = b.researchScore ?? -1;
      if (sb !== sa) return sb - sa;
      return a.name.localeCompare(b.name);
    });

  await writeJson(OUT_FILE, cleaned);

  const stat = (pred: (u: University) => boolean) =>
    cleaned.filter(pred).length;
  console.log('--- UNIREAL dataset stats ---');
  console.log(`Total universities:   ${cleaned.length}`);
  console.log(`Countries:            ${new Set(cleaned.map((u) => u.country)).size}`);
  console.log(`With ROR id:          ${stat((u) => !!u.rorId)}`);
  console.log(`With geo:             ${stat((u) => !!u.geo)}`);
  console.log(`With logo:            ${stat((u) => !!u.logoUrl)}`);
  console.log(`With FA name:         ${stat((u) => !!u.names_i18n?.fa)}`);
  console.log(`With RO name:         ${stat((u) => !!u.names_i18n?.ro)}`);
  console.log(`With tuition (US):    ${stat((u) => u.tuition != null)}`);
  console.log(`With research score:  ${stat((u) => u.researchScore != null)}`);
  console.log(`Wrote ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
