/**
 * Seed Supabase from the local JSON data.
 *
 * Usage (after running migrations 0001 + 0002):
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/05-seed-supabase.ts
 *
 * Idempotent: universities are upserted by id; curated sample reviews are
 * reset (rows with no author) and re-inserted.
 */
import { readFileSync, existsSync } from 'node:fs';
import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';
import universities from '../data/universities.json';
import details from '../data/university-details.json';

// Load .env.local so you can just run `npm run data:seed` (no inline vars).
for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.'
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket as never },
});

const CURATED_UPDATED_AT = '2026-05-20';
const overlay = details as Record<string, any>;

type Row = Record<string, unknown>;

function toRow(u: any): Row {
  const o = overlay[u.slug] ?? {};
  return {
    id: u.id,
    slug: u.slug,
    name: u.name,
    names_i18n: u.names_i18n ?? {},
    country: u.country,
    country_code: u.countryCode,
    city: u.city ?? null,
    region: u.region ?? null,
    website: u.website ?? null,
    domains: u.domains ?? [],
    geo: u.geo ?? null,
    logo_url: u.logoUrl ?? null,
    established_year: u.establishedYear ?? null,
    ror_id: u.rorId ?? null,
    wikidata_id: u.wikidataId ?? null,
    openalex_id: u.openAlexId ?? null,
    ranking: o.ranking ?? u.ranking ?? null,
    research_score: u.researchScore ?? null,
    tuition: u.tuition ?? null,
    admission_rate: u.admissionRate ?? null,
    size: u.size ?? null,
    source: u.source ?? [],
    description_i18n: o.description_i18n ?? null,
    programs_count: o.programsCount ?? null,
    admission: o.admission ?? null,
    international_url: o.internationalUrl ?? null,
    international: o.international ?? null,
    awards: o.awards ?? null,
    medals: o.medals ?? null,
    elite_students: o.eliteStudents ?? null,
    updated_at: overlay[u.slug] ? CURATED_UPDATED_AT : null,
  };
}

async function main() {
  const rows = (universities as any[]).map(toRow);
  console.log(`Upserting ${rows.length} universities…`);

  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from('universities')
      .upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Batch ${i} failed:`, error.message);
      process.exit(1);
    }
    console.log(`  ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
  }

  console.log('Seeding curated sample reviews…');
  for (const [slug, entry] of Object.entries(overlay)) {
    if (slug.startsWith('_') || !entry.externalReviews?.length) continue;
    // reset previous curated (author-less) reviews for this university
    await supabase
      .from('reviews')
      .delete()
      .eq('university_id', slug)
      .is('author_id', null);
    const reviewRows = entry.externalReviews.map((r: any) => ({
      university_id: slug,
      author_name: r.authorName,
      rating: r.rating,
      body: r.body,
      verified: r.verified ?? false,
      source: r.source,
      source_url: r.sourceUrl ?? null,
      created_at: r.createdAt,
    }));
    const { error } = await supabase.from('reviews').insert(reviewRows);
    if (error) console.error(`  reviews for ${slug}:`, error.message);
  }

  console.log('Done.');
}

main();
