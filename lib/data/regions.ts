/**
 * Curated region groupings used for homepage focus and filtering.
 *
 * Country names must match the `country` values stored on the universities
 * (which come from the data pipeline). Both "Czech Republic" and "Czechia" are
 * included so the filter is robust to either spelling.
 */

/**
 * Central + Eastern Europe, EU + Schengen members only. Non-member neighbours
 * (Western Balkans, Moldova, Ukraine, Belarus) are intentionally excluded —
 * enriching them is not worthwhile, since international students target the
 * free-movement EU/Schengen area. See EXCLUDED_COUNTRIES.
 */
export const EASTERN_EUROPE_COUNTRIES: string[] = [
  'Romania',
  'Bulgaria',
  'Hungary',
  'Poland',
  'Czech Republic',
  'Czechia',
  'Slovakia',
  'Slovenia',
  'Croatia',
  'Lithuania',
  'Latvia',
  'Estonia',
];

/**
 * Eastern-European countries removed from the product because they are neither
 * EU nor Schengen members (so enriching/featuring them is not worthwhile).
 * Their universities are hidden site-wide: excluded from public listings
 * (`listUniversities`) and from the sitemap. Values are the exact `country`
 * strings stored on the universities. Reversible — just clear this list.
 */
export const EXCLUDED_COUNTRIES: string[] = [
  'Serbia',
  'Bosnia and Herzegovina',
  'Montenegro',
  'North Macedonia',
  'Albania',
  'Kosovo',
  'Moldova',
  'Ukraine',
  'Belarus',
];

const EXCLUDED_SET = new Set(EXCLUDED_COUNTRIES);

/** True when a university's `country` is on the excluded (non-EU/Schengen) list. */
export function isExcludedCountry(country: string | null | undefined): boolean {
  return !!country && EXCLUDED_SET.has(country);
}
