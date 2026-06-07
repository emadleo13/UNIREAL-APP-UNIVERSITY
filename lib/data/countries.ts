/**
 * Curated study-destination countries used by the `study-in/[country]` landing
 * pages (high-intent SEO: "study in Romania for international students" etc).
 *
 * `match` lists the exact `country` values stored on universities — some have
 * spelling variants (Czech Republic / Czechia), so we filter on all of them.
 * `names` provides the display name per locale.
 */
export type StudyCountry = {
  slug: string;
  /** Primary DB country value. */
  name: string;
  /** All DB country values that map to this destination. */
  match: string[];
  names: { en: string; ro: string; fa: string };
};

export const STUDY_COUNTRIES: StudyCountry[] = [
  { slug: 'romania', name: 'Romania', match: ['Romania'], names: { en: 'Romania', ro: 'România', fa: 'رومانی' } },
  { slug: 'poland', name: 'Poland', match: ['Poland'], names: { en: 'Poland', ro: 'Polonia', fa: 'لهستان' } },
  { slug: 'hungary', name: 'Hungary', match: ['Hungary'], names: { en: 'Hungary', ro: 'Ungaria', fa: 'مجارستان' } },
  { slug: 'bulgaria', name: 'Bulgaria', match: ['Bulgaria'], names: { en: 'Bulgaria', ro: 'Bulgaria', fa: 'بلغارستان' } },
  { slug: 'czech-republic', name: 'Czech Republic', match: ['Czech Republic', 'Czechia'], names: { en: 'Czech Republic', ro: 'Cehia', fa: 'جمهوری چک' } },
  { slug: 'slovakia', name: 'Slovakia', match: ['Slovakia'], names: { en: 'Slovakia', ro: 'Slovacia', fa: 'اسلواکی' } },
  { slug: 'slovenia', name: 'Slovenia', match: ['Slovenia'], names: { en: 'Slovenia', ro: 'Slovenia', fa: 'اسلوونی' } },
  { slug: 'croatia', name: 'Croatia', match: ['Croatia'], names: { en: 'Croatia', ro: 'Croația', fa: 'کرواسی' } },
  { slug: 'serbia', name: 'Serbia', match: ['Serbia'], names: { en: 'Serbia', ro: 'Serbia', fa: 'صربستان' } },
  { slug: 'moldova', name: 'Moldova', match: ['Moldova'], names: { en: 'Moldova', ro: 'Moldova', fa: 'مولداوی' } },
  { slug: 'ukraine', name: 'Ukraine', match: ['Ukraine'], names: { en: 'Ukraine', ro: 'Ucraina', fa: 'اوکراین' } },
  { slug: 'lithuania', name: 'Lithuania', match: ['Lithuania'], names: { en: 'Lithuania', ro: 'Lituania', fa: 'لیتوانی' } },
  { slug: 'latvia', name: 'Latvia', match: ['Latvia'], names: { en: 'Latvia', ro: 'Letonia', fa: 'لتونی' } },
  { slug: 'estonia', name: 'Estonia', match: ['Estonia'], names: { en: 'Estonia', ro: 'Estonia', fa: 'استونی' } },
];

export function findStudyCountry(slug: string): StudyCountry | undefined {
  return STUDY_COUNTRIES.find((c) => c.slug === slug);
}

/** Localized display name with English fallback. */
export function countryName(c: StudyCountry, locale: string): string {
  return c.names[locale as keyof typeof c.names] ?? c.names.en;
}
