import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isAIConfigured, researchWithWebSearch, extractJson } from '@/lib/ai/anthropic';

const SYSTEM = `You are UNIREAL's news editor. Use web search to find 1–3 of TODAY'S most relevant, real, verifiable news items for international university applicants — focus on: scholarships & funding, admission deadlines/changes, and world student olympiads/competitions.

Return ONLY a JSON array (no prose, no markdown) of 1 to 3 objects:
[{
  "title": string,                 // concise, specific headline
  "summary": string,               // one sentence
  "body": string,                  // 150–250 words, factual, neutral
  "category": "scholarship" | "admission" | "olympiad" | "news",
  "sourceUrl": string              // the primary source URL
}]
Only include items you can verify from a real source. Prefer official university / scholarship-body pages. If you find nothing solid, return [].`;

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
  const day = new Date().toISOString().slice(0, 10);
  return `${day}-${base || 'post'}`;
}

type GenItem = {
  title?: string;
  summary?: string;
  body?: string;
  category?: string;
  sourceUrl?: string;
};

const CATEGORIES = ['scholarship', 'admission', 'olympiad', 'news'];

/**
 * Generate today's 1–3 blog posts via Claude + web search and insert them.
 * Returns the number of posts created. No-op when AI isn't configured.
 */
export async function generateDailyPosts(): Promise<number> {
  if (!isAIConfigured()) return 0;

  const text = await researchWithWebSearch({
    system: SYSTEM,
    prompt:
      'Find 1–3 fresh news items per the instructions and return the JSON array.',
    maxTokens: 4000,
  });
  if (!text) return 0;

  const items = extractJson<GenItem[]>(text);
  if (!Array.isArray(items) || items.length === 0) return 0;

  const admin = createSupabaseAdminClient();
  let created = 0;

  for (const item of items.slice(0, 3)) {
    if (!item?.title || !item?.body) continue;
    const category = CATEGORIES.includes(item.category ?? '')
      ? item.category
      : 'news';
    const { error } = await admin.from('posts').insert({
      slug: slugify(item.title),
      title: item.title,
      summary: item.summary ?? null,
      body: item.body,
      category,
      source_url: item.sourceUrl ?? null,
      published: true,
    });
    if (!error) created++;
  }

  return created;
}
