/** Canonical data models shared across the whole app and the data pipeline. */

export type LocalizedNames = {
  en?: string;
  ro?: string;
  fa?: string;
};

export type DataSource =
  | 'hipolabs'
  | 'ror'
  | 'openalex'
  | 'scorecard'
  | 'wikidata';

export type University = {
  /** Stable id (we use the slug). */
  id: string;
  /** SEO-friendly unique slug, e.g. "stanford-university". */
  slug: string;
  /** English / base display name. */
  name: string;
  /** Localized names from OpenAlex / Wikidata. */
  names_i18n?: LocalizedNames;

  country: string;
  /** ISO 3166-1 alpha-2 (e.g. "US", "RO", "IR"). */
  countryCode: string;
  city?: string;
  region?: string;

  website?: string;
  /** Email/web domains — used for the "Verified" badge (email domain match). */
  domains: string[];

  geo?: { lat: number; lng: number };
  logoUrl?: string;
  establishedYear?: number;

  /** Canonical identifiers used to link sources together. */
  rorId?: string;
  wikidataId?: string;
  openAlexId?: string;

  /** Official ranking (optional — only with a clearly licensed source). */
  ranking?: number;
  /** Legal CC0 proxy derived from OpenAlex works/citations. */
  researchScore?: number;

  /** Mostly US, from College Scorecard. */
  tuition?: number;
  admissionRate?: number;
  size?: number;

  /** Which sources contributed to this record. */
  source: DataSource[];
};

export type Review = {
  id: string;
  universityId: string;
  authorName: string;
  rating: number; // 1..5
  body: string;
  verified: boolean;
  createdAt: string; // ISO
};

export type Answer = {
  id: string;
  authorName: string;
  body: string;
  verified: boolean;
  createdAt: string;
};

export type Question = {
  id: string;
  universityId: string;
  authorName: string;
  body: string;
  answers: Answer[];
  createdAt: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  /** University domains this user is verified against. */
  verifiedDomains: string[];
};

export type ListUniversitiesOptions = {
  q?: string;
  country?: string;
  page?: number;
  pageSize?: number;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateReviewInput = {
  universityId: string;
  authorName: string;
  rating: number;
  body: string;
  /** Email used to decide the verified badge (optional). */
  authorEmail?: string;
};

export type CreateQuestionInput = {
  universityId: string;
  authorName: string;
  body: string;
  authorEmail?: string;
};

export type CreateAnswerInput = {
  questionId: string;
  authorName: string;
  body: string;
  authorEmail?: string;
};
