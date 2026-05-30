import { promises as fs } from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(__dirname, '..');
export const DATA_DIR = path.join(ROOT, 'data');
export const RAW_DIR = path.join(DATA_DIR, 'raw');
export const OUT_FILE = path.join(DATA_DIR, 'universities.json');

export const CONTACT_EMAIL =
  process.env.DATA_CONTACT_EMAIL || 'hamidleo1984@gmail.com';

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function ensureDirs(): Promise<void> {
  await fs.mkdir(RAW_DIR, { recursive: true });
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/** fetch JSON with retry + polite delay. */
export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
  retries = 3
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          'User-Agent': `UNIREAL-data-pipeline (mailto:${CONTACT_EMAIL})`,
          Accept: 'application/json',
          ...(init.headers || {}),
        },
      });
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status}`);
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
      const backoff = 800 * (attempt + 1);
      console.warn(`  retry ${attempt + 1}/${retries} after error: ${String(err)}`);
      await sleep(backoff);
    }
  }
  throw lastErr;
}

/** Map a works_count to a 0..100 research-activity score (CC0 OpenAlex proxy). */
export function researchScoreFromWorks(worksCount: number | undefined): number | undefined {
  if (!worksCount || worksCount <= 0) return undefined;
  return Math.round(Math.min(100, Math.log10(worksCount + 1) * 16.6));
}

export function arg(name: string, fallback?: string): string | undefined {
  const pref = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(pref));
  return found ? found.slice(pref.length) : fallback;
}
