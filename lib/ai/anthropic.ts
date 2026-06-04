import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

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

/** Model used for routine, cost-sensitive enrichment + web search. */
export const ENRICH_MODEL = 'claude-sonnet-4-6';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Run a single web-search-backed research call and return the assistant's final
 * text. Handles the server-tool `pause_turn` continuation loop. Returns null on
 * failure so callers can fall back to cached data.
 */
export async function researchWithWebSearch(opts: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string | null> {
  const { system, prompt, maxTokens = 3000 } = opts;
  try {
    const client = getAnthropic();
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: prompt },
    ];

    let response = await client.messages.create({
      model: ENRICH_MODEL,
      max_tokens: maxTokens,
      // Static instructions cached across calls to cut cost/latency.
      system: [
        { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
      ],
      output_config: { effort: 'low' },
      tools: [{ type: 'web_search_20260209', name: 'web_search' } as any],
      messages,
    });

    // Continue the server-side tool loop if it paused.
    let guard = 0;
    while (response.stop_reason === 'pause_turn' && guard++ < 4) {
      messages.push({ role: 'assistant', content: response.content });
      response = await client.messages.create({
        model: ENRICH_MODEL,
        max_tokens: maxTokens,
        system: [
          { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
        ],
        output_config: { effort: 'low' },
        tools: [{ type: 'web_search_20260209', name: 'web_search' } as any],
        messages,
      });
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    return text || null;
  } catch (e) {
    console.error('researchWithWebSearch failed:', e);
    return null;
  }
}

/**
 * Extract the first JSON value (object OR array) from a model response.
 * Handles code fences and surrounding prose. If an array starts before any
 * object, it is parsed as an array; otherwise as an object.
 */
export function extractJson<T = any>(text: string): T | null {
  const firstObj = text.indexOf('{');
  const firstArr = text.indexOf('[');

  let start: number;
  let close: string;
  if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
    start = firstArr;
    close = ']';
  } else if (firstObj !== -1) {
    start = firstObj;
    close = '}';
  } else {
    return null;
  }

  const end = text.lastIndexOf(close);
  if (end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
