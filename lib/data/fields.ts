/**
 * Curated fields of study for the `fields/[field]/[country]` SEO landing
 * pages ("Study Medicine in Romania" etc). Universities are matched by
 * substring keywords against their AI-enriched `programs` list, so the pages
 * get richer automatically as more countries are enriched.
 */
export type StudyField = {
  slug: string;
  names: { en: string; ro: string; fa: string };
  /** Lowercase substrings matched against program names. */
  keywords: string[];
};

export const STUDY_FIELDS: StudyField[] = [
  {
    slug: 'medicine',
    names: { en: 'Medicine', ro: 'Medicină', fa: 'پزشکی' },
    keywords: ['medicin', 'medical', 'surgery', 'nursing', 'midwif', 'physiotherap', 'health'],
  },
  {
    slug: 'dentistry',
    names: { en: 'Dentistry', ro: 'Stomatologie', fa: 'دندان‌پزشکی' },
    keywords: ['dentist', 'dental', 'stomatolog'],
  },
  {
    slug: 'pharmacy',
    names: { en: 'Pharmacy', ro: 'Farmacie', fa: 'داروسازی' },
    keywords: ['pharmac', 'farmac'],
  },
  {
    slug: 'computer-science',
    names: { en: 'Computer Science & IT', ro: 'Informatică și IT', fa: 'علوم کامپیوتر و فناوری اطلاعات' },
    keywords: ['computer', 'informatic', 'software', 'artificial intelligence', 'data science', 'cyber', 'information technology'],
  },
  {
    slug: 'engineering',
    names: { en: 'Engineering', ro: 'Inginerie', fa: 'مهندسی' },
    keywords: ['engineer', 'mechanic', 'electric', 'electron', 'automat', 'mechatron', 'telecommunic', 'robot', 'civil engineering'],
  },
  {
    slug: 'business-management',
    names: { en: 'Business & Management', ro: 'Afaceri și Management', fa: 'مدیریت و بازرگانی' },
    keywords: ['business', 'management', 'mba', 'marketing', 'finance', 'accounting', 'econom', 'administration'],
  },
  {
    slug: 'law',
    names: { en: 'Law', ro: 'Drept', fa: 'حقوق' },
    keywords: ['law', 'legal', 'jurisprud'],
  },
  {
    slug: 'architecture',
    names: { en: 'Architecture', ro: 'Arhitectură', fa: 'معماری' },
    keywords: ['architect', 'urban plan', 'construction'],
  },
  {
    slug: 'agriculture-veterinary',
    names: { en: 'Agriculture & Veterinary', ro: 'Agricultură și Medicină Veterinară', fa: 'کشاورزی و دامپزشکی' },
    keywords: ['agricult', 'agronom', 'veterinar', 'forestry', 'horticult', 'food'],
  },
  {
    slug: 'psychology',
    names: { en: 'Psychology', ro: 'Psihologie', fa: 'روان‌شناسی' },
    keywords: ['psycholog'],
  },
  {
    slug: 'natural-sciences',
    names: { en: 'Natural Sciences & Mathematics', ro: 'Științe ale Naturii și Matematică', fa: 'علوم پایه و ریاضیات' },
    keywords: ['biolog', 'chemis', 'physics', 'mathemat', 'biotechnolog', 'geolog', 'geograph', 'environment'],
  },
  {
    slug: 'humanities',
    names: { en: 'Humanities & Social Sciences', ro: 'Științe Umaniste și Sociale', fa: 'علوم انسانی و اجتماعی' },
    keywords: ['histor', 'philosoph', 'philolog', 'linguist', 'literature', 'language', 'sociolog', 'political', 'international relations'],
  },
  {
    slug: 'education',
    names: { en: 'Education & Teaching', ro: 'Educație și Pedagogie', fa: 'علوم تربیتی و آموزش' },
    keywords: ['education', 'pedagog', 'teacher'],
  },
  {
    slug: 'arts-design',
    names: { en: 'Arts & Design', ro: 'Arte și Design', fa: 'هنر و طراحی' },
    keywords: ['music', 'fine art', 'design', 'film', 'theatre', 'theater', 'visual art', 'performing'],
  },
];

export function findStudyField(slug: string): StudyField | undefined {
  return STUDY_FIELDS.find((f) => f.slug === slug);
}

/** Localized display name with English fallback. */
export function fieldName(f: StudyField, locale: string): string {
  return f.names[locale as keyof typeof f.names] ?? f.names.en;
}

export function universityMatchesField(
  u: { programs?: string[] },
  f: StudyField
): boolean {
  if (!u.programs?.length) return false;
  const hay = u.programs.join(' | ').toLowerCase();
  return f.keywords.some((k) => hay.includes(k));
}
