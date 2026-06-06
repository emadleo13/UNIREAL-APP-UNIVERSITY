import { NextResponse } from 'next/server';
import { generateLatestPost } from '@/lib/blog/generate';
import { isAIConfigured } from '@/lib/ai/anthropic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Web search + generation can take a while; allow up to 5 minutes on Vercel.
export const maxDuration = 300;

/**
 * Cron (vercel.json, every ~10 days): generates one fresh blog post via Claude
 * + web search and publishes it. Protected by CRON_SECRET (Vercel sends it as a
 * Bearer token; manual calls can pass ?secret=...).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const provided =
    req.headers.get('authorization')?.replace('Bearer ', '') ??
    url.searchParams.get('secret');
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!isAIConfigured()) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
  }

  try {
    const created = await generateLatestPost();
    return NextResponse.json({ ok: true, created });
  } catch (e) {
    console.error('generate-blog cron failed:', e);
    return NextResponse.json({ error: 'generation failed' }, { status: 500 });
  }
}
