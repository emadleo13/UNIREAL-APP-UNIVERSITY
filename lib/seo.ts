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

/**
 * Site-wide brand entity graph (Organization + WebSite). Emitted on EVERY page
 * via the locale layout so Google consolidates the brand as one organization at
 * this domain — a Knowledge-Graph signal that helps the site rank for its own
 * name against same-name entities (the UniReal AI paper, the UniRely platform).
 * Every page asserting the same `@id` is how the entity is reinforced sitewide.
 * The WebSite SearchAction exposes a sitelinks search box (Google reads it from
 * the homepage). Fill `socialProfiles` once the official accounts exist so
 * `sameAs` links the brand to them.
 */
export function brandJsonLd(opts: {
  locale: string;
  name: string;
  tagline: string;
}) {
  const { locale, name, tagline } = opts;
  const orgId = `${SITE_URL}/#organization`;
  const socialProfiles: string[] = [];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId,
        name,
        url: SITE_URL,
        logo: `${SITE_URL}/logo-unireal.png`,
        description: tagline,
        ...(socialProfiles.length ? { sameAs: socialProfiles } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name,
        url: SITE_URL,
        inLanguage: locale,
        publisher: { '@id': orgId },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/${locale}/universities?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

/**
 * Turn a unique source string (e.g. an AI-enriched profile blurb) into a
 * search-friendly meta description: whitespace-collapsed and truncated to ~155
 * chars on a word boundary. Returns `undefined` when there is no usable text so
 * callers can fall back to a keyword template — this is what lets each profile
 * carry a distinct description instead of one shared, duplicate-looking line.
 */
export function clampDescription(
  text: string | undefined | null,
  max = 155
): string | undefined {
  if (!text) return undefined;
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return undefined;
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[\s.,;:!?-]+$/, '')}…`;
}
