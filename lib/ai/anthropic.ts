import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import {
  ENRICH_MODEL,
  extractJson,
  researchWithWebSearch as runResearch,
} from '@/lib/data/enrich-core';

/**
 * Lazy Anthropic client. The app keeps working without a key (callers guard on
 * isAIConfigured()); only constructed when a key is present.
 */
let _client: Anthropic | null = null;

export function isAIConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getAnthropic(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set.');
  _client = new Anthropic({ apiKey });
  return _client;
}

/** Re-exported from the runtime-agnostic core so existing imports keep working. */
export { ENRICH_MODEL, extractJson };

/**
 * Run a single web-search-backed research call (uses the env-configured client).
 * Returns null on failure so callers can fall back to cached data.
 */
export async function researchWithWebSearch(opts: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string | null> {
  return runResearch(getAnthropic(), opts);
}
