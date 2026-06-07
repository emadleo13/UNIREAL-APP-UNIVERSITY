import { locales } from '@/lib/i18n/routing';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Canonical + hreflang alternates (including `x-default`) for a locale-prefixed
 * path like '' (home), '/universities' or '/universities/<slug>'. Tells Google
 * the same page exists in en/ro/fa and which to show when no locale matches.
 */
export function localeAlternates(path: string, locale: string) {
  const languages: Record<string, string> = {};
  for (const loc of locales) languages[loc] = `${SITE_URL}/${loc}${path}`;
  languages['x-default'] = `${SITE_URL}/${locales[0]}${path}`;
  return {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages,
  };
}
